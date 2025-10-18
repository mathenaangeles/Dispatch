import os
import boto3
from functools import lru_cache

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

@lru_cache(maxsize=None)
def get_bedrock_client():
    return boto3.client("bedrock-runtime", region_name=AWS_REGION)

@lru_cache(maxsize=None)
def get_s3_client():
    return boto3.client("s3", region_name=AWS_REGION)

@lru_cache(maxsize=None)
def get_lambda_client():
    return boto3.client("lambda", region_name=AWS_REGION)
