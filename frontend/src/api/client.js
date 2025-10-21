import axios from "axios";

const TIMEOUTS = {
  scan: 30000,
  analysis: 100000,
  deploy: 60000
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 100000,
});

api.interceptors.request.use((config) => {
  const userConfig = JSON.parse(localStorage.getItem('dispatchConfig'));
  if (userConfig) {
    config.headers['X-AWS-Config'] = btoa(JSON.stringify({
      region: userConfig.awsRegion,
      accessKey: userConfig.awsAccessKey,
      secretKey: userConfig.awsSecretKey,
      agentId: userConfig.bedrockAgentId,
      agentAliasId: userConfig.bedrockAgentAliasId,
      s3Bucket: userConfig.s3Bucket,
      knowledgeBaseId: userConfig.knowledgeBaseId,
      githubTokenSecret: userConfig.githubTokenSecret
    }));
  }
  return config;
});

export const initiateScan = async (repoUrl, branch = "main") => {
  const { data } = await api.post("/scan", { repo_url: repoUrl, branch }, {
    timeout: TIMEOUTS.scan
  });
  return data;
};

export const getScanResult = async (scanId) => {
  try {
    const { data } = await api.get(`/scan/${scanId}`);
    return {
      ...data,
      agentStatus: data.stage === 'analyzer' ? 'analyzing' : 
                   data.stage === 'deployer' ? 'deploying' : 'scanning'
    };
  } catch (err) {
    if (err.response?.status === 202) {
      return { status: "processing" };
    }
    throw err;
  }
};

export const approveFinding = async (scanId, findingId) => {
  const { data } = await api.post("/approve-finding", {
    scan_id: scanId,
    finding_id: findingId,
  });
  return data;
};

export const rejectFinding = async (scanId, findingId) => {
  const { data } = await api.post("/reject-finding", {
    scan_id: scanId,
    finding_id: findingId,
  });
  return data;
};

export const applyPatches = async (scanId, repoUrl, branch = "main") => {
  const { data } = await api.post("/apply-patches", {
    scan_id: scanId,
    repo_url: repoUrl,
    branch,
  });
  return data;
};

export const checkHealth = async () => {
  try {
    const { data } = await api.get("/health");
    return data;
  } catch {
    return { status: "unreachable" };
  }
};

export default api;
