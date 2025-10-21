from typing import Optional
import boto3
import json
import base64
from fastapi import Header, HTTPException

class AWSConfig:
    def __init__(self, header_value: str):
        try:
            decoded = base64.b64decode(header_value)
            config = json.loads(decoded)
            self.region = config['region']
            self.access_key = config['accessKey']
            self.secret_key = config['secretKey']
            self.agent_id = config['agentId']
            self.agent_alias_id = config['agentAliasId']
            self.s3_bucket = config['s3Bucket']
            self.knowledge_base_id = config['knowledgeBaseId']
            self.github_token_secret = config['githubTokenSecret']
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid AWS configuration: {str(e)}")

def get_aws_config(x_aws_config: Optional[str] = Header(None)) -> AWSConfig:
    if not x_aws_config:
        raise HTTPException(status_code=401, detail="AWS configuration required")
    return AWSConfig(x_aws_config)

def create_aws_session(config: AWSConfig):
    return boto3.Session(
        aws_access_key_id=config.access_key,
        aws_secret_access_key=config.secret_key,
        region_name=config.region
    )

def get_bedrock_client(session: boto3.Session):
    return session.client('bedrock-agent-runtime')

def get_s3_client(session: boto3.Session):
    return session.client('s3')

def get_lambda_client(session: boto3.Session):
    return session.client('lambda')
