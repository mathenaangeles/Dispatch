import os
import uuid
import json
import boto3
import tempfile
import subprocess
from pathlib import Path
from datetime import datetime

s3_client = boto3.client('s3')
secrets_client = boto3.client('secretsmanager')

def lambda_handler(event, context):
    print(f"Scanner Lambda invoked with event: {json.dumps(event)}")
    
    repo_url = event.get('repo_url')
    branch = event.get('branch', 'main')
    scan_id = event.get('scan_id') or f"scan_{uuid.uuid4().hex[:12]}"
    bucket_name = os.environ['S3_RESULTS_BUCKET']
    
    if not repo_url:
        return {
            'statusCode': 400,
            'error': 'repo_url is required'
        }
    
    with tempfile.TemporaryDirectory() as tmp_dir:
        repo_path = Path(tmp_dir) / 'repo'
        
        try:
            github_token = None
            if 'github.com' in repo_url and not repo_url.startswith('https://github.com/'):
                try:
                    github_token = get_github_token()
                except Exception as e:
                    print(f"Warning: Could not retrieve GitHub token: {e}")
            
            print(f"Cloning {repo_url} (branch: {branch})")
            clone_repo(repo_url, repo_path, branch, github_token)
            
            print("Running Semgrep security analysis...")
            scan_results = run_semgrep(repo_path)
            
            structured_results = process_scan_results(scan_results, repo_url, scan_id)
            
            s3_path = f"scan-results/{scan_id}/result.json"
            print(f"Uploading results to s3://{bucket_name}/{s3_path}")
            
            s3_client.put_object(
                Bucket=bucket_name,
                Key=s3_path,
                Body=json.dumps(structured_results, indent=2),
                ContentType='application/json',
                Metadata={
                    'scan_id': scan_id,
                    'repo_url': repo_url,
                    'timestamp': datetime.utcnow().isoformat()
                }
            )
            
            findings_count = len(structured_results.get('findings', []))
            print(f"Scan completed. Found {findings_count} security findings.")
            
            return {
                'statusCode': 200,
                'scan_id': scan_id,
                'findings_count': findings_count,
                's3_path': f"s3://{bucket_name}/{s3_path}",
                'message': f"Security scan completed with {findings_count} findings"
            }
            
        except subprocess.CalledProcessError as e:
            error_msg = f"Semgrep scan failed: {e.stderr}"
            print(error_msg)
            return {
                'statusCode': 500,
                'error': error_msg
            }
        except Exception as e:
            error_msg = f"Scanner error: {str(e)}"
            print(error_msg)
            return {
                'statusCode': 500,
                'error': error_msg
            }

def clone_repo(repo_url, target_path, branch, github_token=None):
    if github_token and 'github.com' in repo_url:
        repo_url = repo_url.replace('https://', f'https://{github_token}@')
    
    cmd = [
        'git', 'clone',
        '--depth', '1',
        '--branch', branch,
        '--single-branch',
        repo_url,
        str(target_path)
    ]
    
    subprocess.run(cmd, check=True, capture_output=True, text=True)

def run_semgrep(repo_path):
    cmd = [
        'semgrep',
        '--config', 'auto',
        '--json',
        '--severity', 'ERROR',
        '--severity', 'WARNING',
        str(repo_path)
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    
    if result.returncode not in [0, 1]:
        raise subprocess.CalledProcessError(result.returncode, cmd, result.stdout, result.stderr)
    
    return json.loads(result.stdout)

def process_scan_results(semgrep_output, repo_url, scan_id):
    findings = []

    severity_map = {
        "error": "high",
        "warning": "medium",
        "info": "low"
    }

    for result in semgrep_output.get("results", []):
        severity = severity_map.get(result.get("extra", {}).get("severity", "").lower(), "unknown")

        finding = {
            "id": f"finding_{len(findings)}",
            "severity": severity,
            "type": result.get("check_id", "Unknown"),
            "file": result.get("path", ""),
            "line": result.get("start", {}).get("line", 0),
            "description": result.get("extra", {}).get("message", ""),
            "code_snippet": result.get("extra", {}).get("lines", ""),
            "llm_analysis": "Pending AI-driven analysis.",
            "recommended_fix": "Pending recommendation.",
            "confidence": 0.9
        }

        findings.append(finding)

    return {
        "scan_id": scan_id,
        "timestamp": datetime.utcnow().isoformat(),
        "repo_url": repo_url,
        "findings": findings,
        "patch_plan": [],
        "dependency_vulnerabilities": {
            "total_vulnerabilities": 0,
            "vulnerabilities": []
        },
        "analysis": {
            "summary": "Initial scan complete. Awaiting LLM analysis.",
            "findings": [f["id"] for f in findings]
        },
        "stats": {
            "total_files_scanned": len({f["file"] for f in findings}),
            "total_findings": len(findings),
            "high_severity": sum(1 for f in findings if f["severity"] == "high"),
            "medium_severity": sum(1 for f in findings if f["severity"] == "medium"),
            "low_severity": sum(1 for f in findings if f["severity"] == "low"),
            "auto_fixable": 0
        },
        "stage": "scanner",
        "status": "scanned"
    }

def get_github_token():
    secret_name = os.environ.get('GITHUB_TOKEN_SECRET_NAME', 'github/awsdispatchprbot')
    response = secrets_client.get_secret_value(SecretId=secret_name)
    return response['SecretString']
