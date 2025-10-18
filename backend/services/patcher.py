import json
from aws import get_bedrock_client

def suggest_patch(findings: dict):
    """
    Suggests secure, context-aware code patches for Semgrep findings using
    AWS Bedrock reasoning models. Falls back gracefully on failure.
    """
    if not findings or not isinstance(findings, dict):
        return {"error": "[PATCHER] Invalid or empty findings data."}

    bedrock = get_bedrock_client()
    findings_text = json.dumps(findings)[:8000]

    try:
        response = bedrock.invoke_model(
            modelId="anthropic.claude-3-sonnet-20240229-v1:0",
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "inputText": (
                    "You are a senior security engineer. For each Semgrep finding "
                    "below, propose minimal, secure, context-aware code patches. "
                    "Output strictly as JSON in this format:\n\n"
                    "[{\"file\": \"<path>\", \"line\": <line_number>, \"suggestion\": \"<patch>\"}]\n\n"
                    f"Findings:\n{findings_text}"
                ),
                "maxTokens": 800,
                "temperature": 0.2
            })
        )

        body = json.loads(response["body"].read())
        output_text = body.get("outputText", "").strip()

        try:
            parsed = json.loads(output_text)
            if isinstance(parsed, list):
                return parsed
            else:
                raise ValueError("Invalid format from model.")
        except Exception:
            return [{
                "file": "unknown",
                "line": 0,
                "suggestion": output_text or "# TODO: Review this issue manually."
            }]

    except Exception as e:
        print(f"[PATCHER] Bedrock invocation failed: {str(e)}")
        patches = []
        for result in findings.get("results", []):
            file = result.get("path", "unknown")
            line = result.get("start", {}).get("line", 0)
            patches.append({
                "file": file,
                "line": line,
                "suggestion": "# TODO: Review this vulnerable line"
            })
        return patches
