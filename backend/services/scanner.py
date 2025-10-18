import os
import json
import subprocess
from datetime import datetime
from aws import get_bedrock_client, get_s3_client

s3 = get_s3_client()
bedrock = get_bedrock_client()

def run_semgrep_scan(project_path: str):
    """
    Run Semgrep static analysis and return structured findings.
    """
    os.makedirs("data/reports", exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"data/reports/semgrep_{timestamp}.json"
    command = [
        "semgrep",
        "--config", "p/security-audit",
        "--config", "p/ci",
        project_path,
        "--json",
        "--output", output_file
    ]
    subprocess.run(command, capture_output=True, text=True)
    try:
        with open(output_file, "r") as f:
            findings = json.load(f)
    except Exception as e:
        return {"error": f"[SCANNER] Failed to parse Semgrep output: {str(e)}"}

    print(f"[SCANNER] Found {len(findings.get('results', []))} issues.")
    return findings


def store_report_s3(file_path: str, bucket_name: str):
    """
    Upload scan report to S3 for traceability and future reference.
    """
    key = f"reports/{os.path.basename(file_path)}"
    try:
        s3.upload_file(file_path, bucket_name, key)
        return f"s3://{bucket_name}/{key}"
    except Exception as e:
        return f"[SCANNER] Failed to upload to S3: {str(e)}"

def summarize_findings_with_bedrock(findings: dict):
    """
    Use Bedrock reasoning model to interpret findings.
    """
    text_to_summarize = json.dumps(findings)[:8000]
    try:
        response = bedrock.invoke_model(
            modelId="anthropic.claude-3-sonnet-20240229-v1:0",
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "inputText": (
                    "You are a security auditor. Summarize and prioritize the "
                    "following Semgrep findings, grouping them by severity, "
                    "impact, and likely fix effort:\n" + text_to_summarize
                ),
                "maxTokens": 400,
                "temperature": 0.2
            })
        )
        body = json.loads(response["body"].read())
        return body.get("outputText", "No summary generated.")
    except Exception as e:
        return f"[SCANNER] Bedrock summarization failed: {str(e)}"


def run_full_scan(project_path: str, bucket_name: str = None):
    """
    Full scanning pipeline:
    1. Run Semgrep static scan.
    2. Store results to S3.
    3. Summarize findings with Bedrock reasoning model.
    """
    findings = run_semgrep_scan(project_path)
    report_path = None
    if bucket_name:
        report_path = store_report_s3(
            f"data/reports/semgrep_latest.json", bucket_name
        )
    summary = summarize_findings_with_bedrock(findings)
    return {
        "findings": findings,
        "summary": summary,
        "report_path": report_path
    }
