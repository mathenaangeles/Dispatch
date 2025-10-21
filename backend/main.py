import os
import json
import uuid
import boto3
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, HttpUrl
from botocore.exceptions import ClientError
from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from bedrock_adapter import create_agent_runtime, invoke_agent
from aws_config import get_aws_config, create_aws_session, get_bedrock_client, get_s3_client, get_lambda_client, AWSConfig

app = FastAPI(title="Dispatch Security Pipeline API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-AWS-Config"],
)

class Finding(BaseModel):
    id: str
    severity: str
    type: str
    file: str
    line: int
    description: str
    code_snippet: str
    llm_analysis: str
    recommended_fix: str
    confidence: float


class PatchPlanItem(BaseModel):
    file: str
    line: int
    suggestion: str
    description: str


class DependencyVulnerabilityItem(BaseModel):
    package: str
    version: str
    severity: str
    description: str
    fixed_version: Optional[str]


class DependencyVulnerabilities(BaseModel):
    total_vulnerabilities: int
    vulnerabilities: List[DependencyVulnerabilityItem]


class Analysis(BaseModel):
    summary: str
    findings: List[str]


class Stats(BaseModel):
    total_files_scanned: int
    total_findings: int
    high_severity: int
    medium_severity: int
    low_severity: int
    auto_fixable: int


class ScanRequest(BaseModel):
    repo_url: HttpUrl
    branch: Optional[str] = "main"


class ScanResponse(BaseModel):
    scan_id: str
    status: str
    message: str


class ScanResultResponse(BaseModel):
    scan_id: str
    timestamp: datetime
    repo_url: HttpUrl
    findings: List[Finding]
    patch_plan: List[PatchPlanItem]
    dependency_vulnerabilities: DependencyVulnerabilities
    analysis: Analysis
    stats: Stats


@app.get("/")
def read_root():
    return {
        "service": "AWS AI Agent Security Pipeline",
        "status": "operational"
    }


@app.post("/scan", response_model=ScanResponse)
async def initiate_scan(
    request: ScanRequest,
    aws_config: AWSConfig = Depends(get_aws_config)
):
    try:
        session_id = f"scan_{uuid.uuid4().hex[:10]}"
        print(f"Starting AgentCore session: {session_id}")

        session = create_aws_session(aws_config)
        bedrock = get_bedrock_client(session)

        agent_response = invoke_agent(
            bedrock,
            agentId=aws_config.agent_id,
            agentAliasId=aws_config.agent_alias_id,
            sessionId=session_id,
            inputText=json.dumps({
                "action": "initiate_security_scan",
                "repo_url": str(request.repo_url),
                "branch": request.branch
            })
        )

        scan_id = extract_scan_id_from_response(agent_response)
        print(f"AgentCore initiated scan: {scan_id}")

        return ScanResponse(
            scan_id=scan_id,
            status="processing",
            message="Security scan initiated. AgentCore is orchestrating Scanner, Analyzer, and Deployer Lambdas."
        )

    except ClientError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to invoke Bedrock AgentCore: {str(e)}"
        )


@app.get("/scan/{scan_id}", response_model=ScanResultResponse)
async def get_scan_result(
    scan_id: str,
    aws_config: AWSConfig = Depends(get_aws_config)
):
    try:
        session = create_aws_session(aws_config)
        s3 = get_s3_client(session)

        response = s3.get_object(
            Bucket=aws_config.s3_bucket,
            Key=f"scan-results/{scan_id}/result.json"
        )
        result = json.loads(response['Body'].read().decode('utf-8'))
        return ScanResultResponse(**result)

    except s3.exceptions.NoSuchKey:
        raise HTTPException(
            status_code=202,
            detail=f"Scan {scan_id} still processing"
        )
    except ClientError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve scan results: {str(e)}"
        )


@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/approve-finding")
async def approve_finding(
    scan_id: str = Body(...), 
    finding_id: str = Body(...),
    aws_config: AWSConfig = Depends(get_aws_config)
):
    key = f"scan-results/{scan_id}/result.json"
    try:
        session = create_aws_session(aws_config)
        s3 = get_s3_client(session)
        
        response = s3.get_object(Bucket=aws_config.s3_bucket, Key=key)
        result = json.loads(response["Body"].read().decode("utf-8"))

        for finding in result.get("findings", []):
            if finding["id"] == finding_id:
                finding["approved"] = True
                break

        s3.put_object(
            Bucket=aws_config.s3_bucket,
            Key=key,
            Body=json.dumps(result, indent=2).encode("utf-8"),
            ContentType="application/json"
        )

        return {"status": "success", "message": f"Finding {finding_id} approved"}

    except s3.exceptions.NoSuchKey:
        raise HTTPException(status_code=404, detail="Scan not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/reject-finding")
async def reject_finding(
    scan_id: str = Body(...), 
    finding_id: str = Body(...),
    aws_config: AWSConfig = Depends(get_aws_config)
):
    key = f"scan-results/{scan_id}/result.json"
    try:
        session = create_aws_session(aws_config)
        s3 = get_s3_client(session)
        
        response = s3.get_object(Bucket=aws_config.s3_bucket, Key=key)
        result = json.loads(response["Body"].read().decode("utf-8"))

        for finding in result.get("findings", []):
            if finding["id"] == finding_id:
                finding["approved"] = False
                finding["rejected"] = True
                break

        s3.put_object(
            Bucket=aws_config.s3_bucket,
            Key=key,
            Body=json.dumps(result, indent=2).encode("utf-8"),
            ContentType="application/json"
        )

        return {"status": "success", "message": f"Finding {finding_id} rejected"}

    except s3.exceptions.NoSuchKey:
        raise HTTPException(status_code=404, detail="Scan not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

lambda_client = boto3.client(
    "lambda",
    region_name=os.getenv("AWS_REGION", "us-east-1")
)

@app.post("/apply-patches")
async def apply_patches(
    scan_id: str = Body(...),
    repo_url: str = Body(...),
    branch: str = Body("main"),
    aws_config: AWSConfig = Depends(get_aws_config)
):
    try:
        deployer_function = os.getenv("DEPLOYER_LAMBDA_NAME")
        if not deployer_function:
            raise HTTPException(status_code=500, detail="DEPLOYER_LAMBDA_NAME not configured")

        session = create_aws_session(aws_config)
        lambda_client = get_lambda_client(session)

        payload = {
            "scan_id": scan_id,
            "repo_url": repo_url,
            "branch": branch,
            "github_token_secret_name": aws_config.github_token_secret,
            "s3_bucket": aws_config.s3_bucket
        }

        response = lambda_client.invoke(
            FunctionName=deployer_function,
            InvocationType="Event",
            Payload=json.dumps(payload)
        )

        return {
            "status": "initiated",
            "message": f"Deployment triggered for scan {scan_id}",
            "lambda_response": str(response)
        }
    except ClientError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to invoke Deployer Lambda: {str(e)}"
        )

def extract_scan_id_from_response(agent_response):
    try:
        events = agent_response.get("completion") or agent_response.get("eventStream") or []
        for event in events:
            if "chunk" in event:
                chunk_data = event["chunk"].get("bytes", b"").decode("utf-8")
                try:
                    data = json.loads(chunk_data)
                    if "scan_id" in data:
                        return data["scan_id"]
                except json.JSONDecodeError:
                    continue
    except Exception as e:
        print(f"Error parsing AgentCore response: {e}")

    return f"scan_{uuid.uuid4().hex[:12]}"