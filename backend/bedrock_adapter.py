import os
from typing import Any, Dict, Optional

_HAS_AGENTCORE = False
_agentcore = None
try:
    import bedrock_agentcore as _agentcore
    _HAS_AGENTCORE = True
except ImportError:
    import boto3
    _HAS_AGENTCORE = False

def create_agent_runtime(region_name: Optional[str] = None) -> Any:
    region = region_name or os.getenv("AWS_REGION", "us-east-1")
    if _HAS_AGENTCORE:
        return _agentcore.AgentRuntime(region_name=region)
    return boto3.client("bedrock-agent-runtime", region_name=region)

def create_model_runtime(region_name: Optional[str] = None) -> Any:
    region = region_name or os.getenv("AWS_REGION", "us-east-1")
    if _HAS_AGENTCORE:
        return _agentcore.ModelRuntime(region_name=region)
    return boto3.client("bedrock-runtime", region_name=region)

def invoke_agent(client: Any, **kwargs: Any) -> Dict[str, Any]:
    if _HAS_AGENTCORE:
        return client.invoke(**kwargs)
    return client.invoke_agent(**kwargs)

def invoke_model(client: Any, **kwargs: Any) -> Dict[str, Any]:
    if _HAS_AGENTCORE:
        return client.invoke(**kwargs)
    return client.invoke_model(**kwargs)

def retrieve_kb(client: Any, **kwargs: Any) -> Dict[str, Any]:
    if _HAS_AGENTCORE:
        return client.retrieve(**kwargs)
    return client.retrieve(**kwargs)
