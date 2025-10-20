# Dispatch

Dispatch is a DevSecOps AI agent powered by **Amazon Bedrock AgentCore**, **AWS Lambda**, **FastAPI**, and **React + Vite**.

This pipeline scans code repositories for vulnerabilities, provides LLM-driven analysis, and automatically deploys fixes through pull requests.


## Prerequisites

Before setting up locally or deploying to AWS, ensure you have:

- [AWS Account](https://aws.amazon.com/)
- [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [Docker](https://www.docker.com/)
- [Python 3.10+](https://www.python.org/)
- [Node.js 18+](https://nodejs.org/)
- [GitHub Personal Access Token (PAT)](https://github.com/settings/tokens) 

#### Amazon Web Services 
- Create a dedicated **S3 bucket** to store scan results and patch reports.
- You’ll need an **Amazon Bedrock Agent (AgentCore)** that orchestrates your workflow.
- You should have three Lambda functions deployed and registered with Bedrock: `ScannerLambda`, `AnalyzerLambda`, and `DeployerLambda`.
- Store a GitHub PAT (Personal Access Token) in AWS Secrets Manager to allow secure repository access.

## Environment Variables

Create a `.env` file in both `/backend` and `/frontend` with these keys:

### Backend (`/backend/.env`)
```
AWS_REGION=your_aws_region_here
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

BEDROCK_AGENT_ID=your_bedrock_agent_id_here
BEDROCK_AGENT_ALIAS_ID=your_bedrock_agent_alias_here

S3_RESULTS_BUCKET=your_s3_bucket_here

BEDROCK_KNOWLEDGE_BASE_ID=your_knowledge_base_id_here

GITHUB_TOKEN_SECRET_NAME=your_github_token_secret_name_here
```
### Frontend (`/frontend/.env`)
```
VITE_API_URL=http://localhost:8000
```

## Getting Started
1. Clone the repository.
2. Start the containers by running `docker compose up --build`.

_Stop the containers by running `docker compose down`._