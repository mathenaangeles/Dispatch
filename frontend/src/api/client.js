import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 60000
});

export const scanCode = (projectPath) =>
  api.post("/scan", { project_path: projectPath });

export const analyzeCode = (projectPath) =>
  api.post("/analyze", { project_path: projectPath });

export const patchCode = (projectPath) =>
  api.post("/patch", { project_path: projectPath });

export default api;
