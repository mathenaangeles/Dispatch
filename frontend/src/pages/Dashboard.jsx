import { useState } from "react";
import { scanCode, analyzeCode, patchCode } from "../api/client";
import Loader from "../components/Loader";
import ScanResults from "../components/ScanResults";

export default function Dashboard() {
  const [path, setPath] = useState("../sample-vuln-repo");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleScan = async () => {
    setLoading(true);
    setReport(null);
    try {
      const { data } = await scanCode(path);
      setReport(data);
    } catch (err) {
      setReport({ error: err?.response?.data || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">CodeGuardian Pro</h1>

      <div className="flex gap-2">
        <input
          className="border p-2 flex-1 rounded"
          placeholder="Enter server-side project path"
          value={path}
          onChange={(e) => setPath(e.target.value)}
        />
        <button
          onClick={handleScan}
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={!path || loading}
        >
          {loading ? "Scanning..." : "Scan"}
        </button>
      </div>

      {loading && <Loader />}

      <div className="mt-6">
        <ScanResults report={report} />
      </div>
    </div>
  );
}