import json
from aws import get_bedrock_client

bedrock = get_bedrock_client()

def analyze_findings(findings: dict):
    if not findings or "results" not in findings:
        return {"error": "[ANALYZER] No valid findings provided."}
    condensed = []
    for result in findings["results"][:30]:
        condensed.append({
            "rule_id": result.get("check_id"),
            "severity": result.get("extra", {}).get("severity"),
            "message": result.get("extra", {}).get("message"),
            "path": result.get("path"),
            "start": result.get("start", {}),
            "end": result.get("end", {}),
            "lines": result.get("extra", {}).get("lines")
        })
    analysis_prompt = (
        "You are a senior application security analyst. Analyze the following static "
        "analysis results and generate a JSON response with the fields: "
        "`summary`, `risk_profile`, and `recommendations`. "
        "`risk_profile` should group vulnerabilities by severity (High/Medium/Low) "
        "and estimate exploitability (0–1) and business impact. "
        "`recommendations` should outline prioritized actions developers should take. "
        "Be concise but precise. Do not include explanations outside JSON.\n\n"
        f"Findings:\n{json.dumps(condensed, indent=2)}"
    )
    try:
        response = bedrock.invoke_model(
            modelId="anthropic.claude-3-sonnet-20240229-v1:0",
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "inputText": analysis_prompt,
                "maxTokens": 800,
                "temperature": 0.2
            })
        )
        raw = json.loads(response["body"].read())
        text_output = raw.get("outputText", "").strip()
        try:
            structured_output = json.loads(text_output)
            return structured_output
        except json.JSONDecodeError:
            return {"summary": text_output}
    except Exception as e:
        return {"error": f"[ANALYZER] Bedrock analysis failed: {str(e)}"}
