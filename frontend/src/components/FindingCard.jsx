import { useState } from 'react';
import { ChevronDown, ChevronRight, FileCode, CheckCircle, XCircle, Eye, Wrench, X, ChevronLeft, ChevronUp } from 'lucide-react';
import SeverityBadge from './SeverityBadge';

export default function FindingCard({ finding, onApprove, onReject, onViewDiff }) {
  const [expanded, setExpanded] = useState(false);
  const isApproved = finding.approved;
  const isRejected = finding.rejected;

  return (
    <div className={`bg-white rounded-lg border shadow-sm transition-all overflow-hidden ${
      isApproved ? 'border-green-400 bg-green-50' : 
      isRejected ? 'border-gray-400 bg-gray-50 opacity-60' : 
      'border-gray-200 hover:border-gray-300'
    }`}>
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">
              {expanded ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <SeverityBadge severity={finding.severity} />
                <h3 className="font-semibold text-gray-900">{finding.type}</h3>
                {finding.auto_fixable && (
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-md font-medium">
                    <Wrench className="w-3 h-3" />
                    Auto-Fixable
                  </span>
                )}
                {!finding.auto_fixable && (
                  <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md font-medium">
                    <FileCode className="w-3 h-3" />
                    Manual Review
                  </span>
                )}
                {isApproved && (
                  <span className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-0.5 rounded-md font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Approved
                  </span>
                )}
                {isRejected && (
                  <span className="flex items-center gap-1 text-xs bg-gray-500 text-white px-2 py-0.5 rounded-md font-medium">
                    <XCircle className="w-3 h-3" />
                    Rejected
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-2">{finding.description}</p>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FileCode className="w-3 h-3" />
                  {finding.file}:{finding.line}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {Math.round(finding.confidence * 100)}% confidence
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Vulnerable Code</h4>
              <pre className="bg-red-50 border border-red-200 rounded p-3 text-xs overflow-x-auto">
                <code className="text-red-800">{finding.code_snippet}</code>
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">LLM Analysis</h4>
              <p className="text-sm text-gray-600 bg-white border border-gray-200 rounded p-3">
                {finding.llm_analysis}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Recommended Fix</h4>
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
                {finding.recommended_fix}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              {!isApproved && !isRejected && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onApprove(finding.id);
                    }}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReject(finding.id);
                    }}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
              {(isApproved || isRejected) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove(finding.id, true);
                  }}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <X className="w-4 h-4" />
                  Reset Status
                </button>
              )}
              <button
                className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDiff(finding);
                }}
              >
                <Eye className="w-4 h-4" />
                View Full Diff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
