import { useState } from "react";
import { initiateScan, getScanResult, approveFinding, rejectFinding, applyPatches } from "../api/client";
import Header from "../components/Header";
import ScanInput from "../components/ScanInput";
import LoadingState from "../components/LoadingState";
import StatsOverview from "../components/StatsOverview";
import ResultsTabs from "../components/ResultsTabs";
import ErrorDisplay from "../components/ErrorDisplay";
import ApprovalSidebar from "../components/ApprovalSidebar";
import DiffModal from "../components/DiffModal";
import { CheckCircle, Rocket } from "lucide-react";

export default function Dashboard() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyingPatches, setApplyingPatches] = useState(false);
  const [lastScanDuration, setLastScanDuration] = useState(null);
  const [scanId, setScanId] = useState(null);

  const formatDuration = (start, end) => {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs <= 0) return "0s";
    const totalSeconds = diffMs / 1000;
    if (totalSeconds >= 60) {
      const minutes = Math.floor(totalSeconds / 60);
      const remainingSeconds = Math.round(totalSeconds % 60);
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${totalSeconds.toFixed(1)}s`;
  };

  const pollForResults = async (id, startTime) => {
    let retries = 0;
    while (retries < 20) {
      const res = await getScanResult(id);
      if (res.status !== "processing") {
        setReport(res);
        const duration = formatDuration(startTime, res.timestamp);
        setLastScanDuration(duration);
        return;
      }
      await new Promise((r) => setTimeout(r, 5000));
      retries++;
    }
    setReport({ error: "Timed out waiting for scan results." });
  };

  const handleScan = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setReport(null);
    const scanStartTime = new Date();

    try {
      const scan = await initiateScan(input);
      setScanId(scan.scan_id);
      await pollForResults(scan.scan_id, scanStartTime);
      setSidebarOpen(true);
      setActiveTab("findings");
    } catch (err) {
      console.error(err);
      setReport({ error: err.response?.data || err.message || "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (findingId, reset = false) => {
    if (!scanId) return;
    await approveFinding(scanId, findingId);
    const updatedFindings = report.findings.map((f) =>
      f.id === findingId ? { ...f, approved: reset ? false : true, rejected: false } : f
    );
    setReport({ ...report, findings: updatedFindings });
  };

  const handleReject = async (findingId) => {
    if (!scanId) return;
    await rejectFinding(scanId, findingId);
    const updatedFindings = report.findings.map((f) =>
      f.id === findingId ? { ...f, rejected: true, approved: false } : f
    );
    setReport({ ...report, findings: updatedFindings });
  };

  const handleViewDiff = (finding) => {
    const patch = report.patch_plan?.find(
      (p) => p.file === finding.file && p.line === finding.line
    );
    setSelectedFinding({ ...finding, patch });
  };

  const handleApplyAllPatches = async () => {
    if (!scanId) return;
    setApplyingPatches(true);
    try {
      const result = await applyPatches(scanId, input);
      setReport({ ...report, apply_result: result, patches_applied: true });
      setShowApplyModal(false);
      setActiveTab("overview");
    } catch (err) {
      console.error("Failed to apply patches:", err);
    } finally {
      setApplyingPatches(false);
    }
  };

  const approvedCount = report?.findings?.filter?.((f) => f.approved)?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50 relative z-10">
      <Header lastScanTime={report?.timestamp} />

      {report && (
        <ApprovalSidebar
          findings={report.findings || []}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      )}

      {selectedFinding && (
        <DiffModal
          finding={selectedFinding}
          patch={selectedFinding.patch}
          onClose={() => setSelectedFinding(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        <ScanInput
          input={input}
          setInput={setInput}
          isRepo={true}
          setIsRepo={() => {}}
          onScan={handleScan}
          loading={loading}
          lastScanDuration={lastScanDuration}
        />

        <div className="mt-6">
          {loading && <LoadingState />}

          {report && !loading && !report.error && (
            <>
              <StatsOverview stats={report.stats} />

              {report.patch_plan && !report.patches_applied && approvedCount > 0 && (
                <div className="bg-white border border-blue-200 rounded-xl p-6 my-8 shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-blue-900 leading-snug">
                          Ready for Secure Deployment
                        </h3>
                        <p className="text-base text-gray-700 mt-2">
                          You have <span className="font-semibold text-gray-900">{approvedCount}</span> approved finding
                          {approvedCount !== 1 ? "s" : ""}.
                        </p>
                      </div>
                    </div>
                    <div className="ml-6 flex-shrink-0 self-center">
                      <button
                        onClick={() => setShowApplyModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg flex items-center gap-2 text-base"
                      >
                        <Rocket className="w-5 h-5" />
                        Apply Fixes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <ResultsTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                report={report}
                onApprove={handleApprove}
                onReject={handleReject}
                onViewDiff={handleViewDiff}
              />
            </>
          )}

          {report?.error && <ErrorDisplay error={report.error} />}
        </div>
      </div>
    </div>
  );
}
