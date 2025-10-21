import re
import os
import json
import boto3
from datetime import datetime
from bedrock_adapter import create_model_runtime, create_agent_runtime, invoke_model, retrieve_kb

s3_client = boto3.client('s3')
bedrock_runtime = create_model_runtime()
bedrock_agent_runtime = create_agent_runtime()

def lambda_handler(event, context):
    print(f"Analyzer Lambda invoked with event: {json.dumps(event)}")

    scan_id = event.get('scan_id')
    bucket_name = os.environ['S3_RESULTS_BUCKET']
    kb_id = os.environ['BEDROCK_KNOWLEDGE_BASE_ID']

    if not scan_id:
        return {
            'statusCode': 400,
            'error': 'scan_id is required'
        }

    try:
        print(f"Retrieving scan results for {scan_id}")
        scan_data = get_scan_results(bucket_name, scan_id)
        findings = scan_data.get('findings', [])

        print(f"Analyzing {len(findings)} security findings...")

        patch_plan = []
        updated_findings = []

        for idx, finding in enumerate(findings):
            print(f"Processing finding {idx + 1}/{len(findings)}: {finding['type']}")

            try:
                kb_context = query_knowledge_base(
                    kb_id,
                    finding['type'],
                    finding['description']
                )

                fix = generate_fix_with_claude(finding, kb_context)

                finding['llm_analysis'] = fix.get('explanation', 'No analysis generated.')
                finding['recommended_fix'] = fix.get('code', finding['code_snippet'])
                finding['confidence'] = fix.get('confidence', 0.85)

                updated_findings.append(finding)

                remediation = {
                    'finding_id': finding['id'],
                    'file': finding['file'],
                    'line': finding['line'],
                    'end_line': finding.get('end_line', finding['line']),
                    'vulnerability': finding['type'],
                    'severity': finding['severity'],
                    'original_code': finding['code_snippet'],
                    'fixed_code': fix['code'],
                    'explanation': fix['explanation'],
                    'references': fix.get('references', []),
                    'confidence': fix.get('confidence', 0.85)
                }

                patch_plan.append(remediation)

            except Exception as e:
                print(f"Error analyzing finding {finding['id']}: {str(e)}")
                updated_findings.append(finding)
                continue

        scan_data['findings'] = updated_findings
        scan_data['patch_plan'] = patch_plan
        scan_data['analysis'] = {
            'summary': f"Automated analysis complete for {len(updated_findings)} findings.",
            'findings': [f['id'] for f in updated_findings]
        }

        stats = scan_data.get('stats', {})
        stats.update({
            'total_remediations': len(patch_plan),
            'high_severity': sum(1 for r in patch_plan if r['severity'] == 'high'),
            'medium_severity': sum(1 for r in patch_plan if r['severity'] == 'medium')
        })
        scan_data['stats'] = stats
        scan_data['status'] = 'analyzed'
        scan_data['stage'] = 'analyzer'
        scan_data['timestamp'] = datetime.utcnow().isoformat()

        output_path = f"scan-results/{scan_id}/result.json"

        s3_client.put_object(
            Bucket=bucket_name,
            Key=output_path,
            Body=json.dumps(scan_data, indent=2),
            ContentType='application/json'
        )

        print(f"Analysis complete. Generated {len(patch_plan)} remediations.")

        return {
            'statusCode': 200,
            'scan_id': scan_id,
            'remediations_count': len(patch_plan),
            's3_path': f"s3://{bucket_name}/{output_path}",
            'message': f"Generated {len(patch_plan)} security remediations"
        }

    except Exception as e:
        error_msg = f"Analyzer error: {str(e)}"
        print(error_msg)
        return {
            'statusCode': 500,
            'error': error_msg
        }


def get_scan_results(bucket_name, scan_id):
    response = s3_client.get_object(
        Bucket=bucket_name,
        Key=f"scan-results/{scan_id}/result.json"
    )
    return json.loads(response['Body'].read().decode('utf-8'))


def query_knowledge_base(kb_id, vulnerability_type, description):
    query_text = f"""
    Security vulnerability: {vulnerability_type}
    Description: {description}

    Provide remediation guidance, best practices, and secure code examples.
    """

    print(f"Querying Knowledge Base for: {vulnerability_type}")

    response = retrieve_kb(
        bedrock_agent_runtime,
        knowledgeBaseId=kb_id,
        retrievalQuery={'text': query_text},
        retrievalConfiguration={'vectorSearchConfiguration': {'numberOfResults': 5}}
    )

    contexts = []
    for result in response.get('retrievalResults', []):
        content = result.get('content', {}).get('text', '')
        score = result.get('score', 0)
        if score > 0.5:
            contexts.append({
                'text': content,
                'score': score,
                'source': result.get('location', {}).get('s3Location', {})
            })

    return contexts


def generate_fix_with_claude(finding, kb_context):
    context_text = "\n\n".join([
        f"Reference (relevance: {ctx['score']:.2f}):\n{ctx['text']}"
        for ctx in kb_context[:3]
    ])

    prompt = f"""You are a security expert analyzing a code vulnerability. Generate a secure fix based on industry standards.

    VULNERABILITY DETAILS:
    - Type: {finding['type']}
    - File: {finding['file']}
    - Line: {finding['line']}
    - Severity: {finding['severity']}
    - Description: {finding['description']}

    VULNERABLE CODE:
    ```
    {finding['code_snippet']}
    ```

    SECURITY STANDARDS CONTEXT (from CWE/OWASP):
    {context_text if context_text else 'No specific standards found. Use general security best practices.'}

    TASK:
    Generate a secure code fix that addresses this vulnerability. Provide:
    1. The corrected code (only the fixed lines, maintain formatting)
    2. A clear explanation of what was wrong and how the fix addresses it
    3. Any relevant CWE/OWASP references

    Format your response as JSON:
    {{
    "code": "corrected code here",
    "explanation": "explanation of the fix",
    "references": ["CWE-89", "OWASP A03:2021"],
    "confidence": 0.95
    }}

    Respond ONLY with valid JSON, no additional text."""

    body = {
        'anthropic_version': 'bedrock-2023-05-31',
        'max_tokens': 2000,
        'temperature': 0.1,
        'messages': [{'role': 'user', 'content': prompt}]
    }

    response = invoke_model(
        bedrock_runtime,
        modelId='anthropic.claude-3-5-sonnet-20241022-v2:0',
        contentType='application/json',
        accept='application/json',
        body=json.dumps(body)
    )

    response_body = json.loads(response['body'].read())
    claude_response = response_body['content'][0]['text']

    try:
        fix_data = json.loads(claude_response)
    except json.JSONDecodeError:
        json_match = re.search(r'\{[\s\S]*\}', claude_response)
        if json_match:
            fix_data = json.loads(json_match.group())
        else:
            fix_data = {
                'code': finding['code_snippet'],
                'explanation': 'Could not generate fix',
                'references': [],
                'confidence': 0.0
            }

    return fix_data
