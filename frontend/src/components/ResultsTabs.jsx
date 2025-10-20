import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { Download, FileCode, AlertCircle } from 'lucide-react';

import FindingCard from './FindingCard';

export default function ResultsTabs({ 
  activeTab, 
  setActiveTab, 
  report, 
  onApprove, 
  onReject, 
  onViewDiff
}) {
  const renderPatchPlan = () => {
    if (!report.patch_plan) {
      return (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No patches generated</p>
        </div>
      );
    }

    if (Array.isArray(report.patch_plan)) {
      return (
        <div className="space-y-4">
          {report.patch_plan.map((patch, index) => (
            <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <FileCode className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{patch.file}</h4>
                  <p className="text-sm text-gray-600 mt-1">Line {patch.line}</p>
                </div>
              </div>
              <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                {patch.suggestion || 'No suggestion provided'}
              </div>
              {patch.description && (
                <p className="text-sm text-gray-600 mt-2">{patch.description}</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (typeof report.patch_plan === 'object') {
      return (
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto font-mono">
          {JSON.stringify(report.patch_plan, null, 2)}
        </pre>
      );
    }

    return (
      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto font-mono">
        {String(report.patch_plan)}
      </pre>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="border-b border-gray-200">
        <div className="flex gap-1 px-4">
          {['overview', 'findings', 'patches'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Repository
                </h3>
                  {report.repository || report.repo_url ? (
                    <a
                      href={report.repository || report.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 mt-1 break-all transition-colors"
                    >
                      {report.repository || report.repo_url}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-800 mt-1">N/A</p>
                  )}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Scan ID
                </h3>
                <p className="text-sm font-mono text-gray-800 mt-1">
                  {report.scan_id || "N/A"}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Summary
                </h3>
                <p className="text-sm text-gray-800 mt-1">
                  Found {report.stats?.total_findings || 0} security issues across{" "}
                  {report.stats?.total_files_scanned || 0} files.
                  {report.stats?.auto_fixable > 0 &&
                    ` ${report.stats.auto_fixable} can be automatically fixed.`}
                </p>
              </div>
            </div>
            {report.analysis?.summary && (
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {report.analysis.summary}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {activeTab === 'findings' && (
          <div className="space-y-3">
            {report.findings?.length > 0 ? (
              report.findings.map((finding) => (
                <FindingCard
                  key={finding.id}
                  finding={{
                    ...finding,
                    auto_fixable: Array.isArray(report.patch_plan) && report.patch_plan.some((p) => p.file?.trim() === finding.file?.trim())
                  }}
                  onApprove={onApprove}
                  onReject={onReject}
                  onViewDiff={onViewDiff}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No findings to display</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'patches' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Patch Plan ({Array.isArray(report.patch_plan) ? report.patch_plan.length : 0} patches)
              </h3>
              <button 
                onClick={() => {
                  const blob = new Blob([JSON.stringify(report.patch_plan, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'patch-plan.json';
                  a.click();
                }}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
            {renderPatchPlan()}
          </div>
        )}
      </div>
    </div>
  );
}