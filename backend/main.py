from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import JSONResponse
from services.scanner import run_semgrep_scan
from services.analyzer import analyze_findings
from services.patcher import suggest_patch
from services.manager import apply_patch
import os

app = FastAPI(
    title="CodeGuardian",
    description="AI-powered autonomous code security and patching agent",
    version="1.0.0"
)

@app.get("/")
def root():
    return {"message": "CodeGuardian backend running successfully."}


@app.post("/scan")
async def scan_code(project_path: str = Form(...)):
    """
    Run Semgrep scan and return raw findings.
    This endpoint only performs static analysis without reasoning.
    """
    findings = run_semgrep_scan(project_path)
    return JSONResponse(findings)


@app.post("/analyze")
async def analyze(project_path: str = Form(...)):
    """
    Run Semgrep + AI reasoning to summarize vulnerabilities.
    Uses Amazon Bedrock or mock reasoning (depending on setup).
    """
    findings = run_semgrep_scan(project_path)
    report = analyze_findings(findings)
    return JSONResponse({"summary": report})


@app.post("/patch")
async def patch_code(project_path: str = Form(...)):
    """
    Runs Semgrep → analyzes vulnerabilities → suggests patch → applies fix.
    Returns summary of applied patch.
    """
    findings = run_semgrep_scan(project_path)
    patch = suggest_patch(findings)
    result = apply_patch(project_path, patch)
    return JSONResponse({
        "status": "patched",
        "details": result
    })
