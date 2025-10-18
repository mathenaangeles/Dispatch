import os
import git
import json
import tempfile
from datetime import datetime
from aws import get_s3_client, get_bedrock_client

s3 = get_s3_client()
bedrock = get_bedrock_client()

def apply_patch(project_path: str, patches: list, bucket_name: str = None, push_remote: bool = False):
    if not os.path.isdir(project_path):
        return {"error": f"[MANAGER] Invalid project path: {project_path}"}
    try:
        repo = git.Repo(project_path)
    except Exception as e:
        return {"error": f"[MANAGER] Not a valid git repo: {str(e)}"}

    branch_name = f"fix/autopatch-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    try:
        repo.git.checkout("-b", branch_name)
    except Exception:
        repo.git.checkout(branch_name)

    applied_files = []
    patch_summary = []

    for patch in patches:
        file_path = os.path.join(project_path, patch.get("file"))
        if not os.path.isfile(file_path):
            continue
        try:
            with open(file_path, "r") as f:
                original = f.read()
            new_content = original + "\n" + patch.get("suggestion", "") + "\n"
            with open(file_path, "w") as f:
                f.write(new_content)
            repo.git.add(file_path)
            applied_files.append(file_path)
            patch_summary.append({
                "file": patch["file"],
                "description": patch.get("description"),
                "inserted_code": patch.get("suggestion", "")[:150]
            })
        except Exception as e:
            patch_summary.append({
                "file": patch.get("file"),
                "error": str(e)
            })

    repo.index.commit("Apply patch from Dispatch")

    if push_remote:
        try:
            origin = repo.remote(name="origin")
            origin.push(branch_name)
        except Exception as e:
            patch_summary.append({"error": f"[MANAGER] Push failed: {str(e)}"})

    metadata = {
        "branch": branch_name,
        "patched_files": len(applied_files),
        "timestamp": datetime.utcnow().isoformat(),
        "patch_summary": patch_summary
    }

    report_path = None
    if bucket_name:
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as tmp:
                json.dump(metadata, tmp, indent=2)
                tmp.flush()
                key = f"patch_reports/{branch_name}.json"
                s3.upload_file(tmp.name, bucket_name, key)
                report_path = f"s3://{bucket_name}/{key}"
        except Exception as e:
            metadata["s3_error"] = f"[MANAGER] Failed to upload patch metadata: {str(e)}"
    return {
        "status": "success",
        "branch": branch_name,
        "patched_files": len(applied_files),
        "report_path": report_path,
        "details": patch_summary
    }


def plan_patch_with_bedrock(findings_summary: dict):
    prompt = (
        "You are a senior software engineer. Based on the following vulnerability summary, "
        "propose a prioritized plan of code patches. Each plan item should include the file path, "
        "issue description, and a brief patch suggestion (<=5 lines). Return JSON only.\n\n"
        f"{json.dumps(findings_summary, indent=2)}"
    )
    try:
        response = bedrock.invoke_model(
            modelId="anthropic.claude-3-sonnet-20240229-v1:0",
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "inputText": prompt,
                "maxTokens": 700,
                "temperature": 0.3
            })
        )
        raw = json.loads(response["body"].read())
        text_output = raw.get("outputText", "").strip()
        try:
            structured = json.loads(text_output)
            return structured
        except json.JSONDecodeError:
            return {"raw_text": text_output}
    except Exception as e:
        return {"error": f"[MANAGER] Bedrock patch planning failed: {str(e)}"}
