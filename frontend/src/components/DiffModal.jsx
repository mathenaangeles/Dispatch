import { X, FileCode, AlertTriangle, CheckCircle } from 'lucide-react';
import SeverityBadge from './SeverityBadge';

export default function DiffModal({ finding, patch, onClose }) {
  if (!finding) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Patch Preview</h2>
            <p className="text-sm text-gray-600 mt-1 font-mono">{finding.file}:{finding.line}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <SeverityBadge severity={finding.severity} />
              <h3 className="font-semibold text-gray-900">{finding.type}</h3>
            </div>
            <p className="text-sm text-gray-600">{finding.description}</p>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Current (Vulnerable)
              </h4>
              <pre className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-sm overflow-x-auto">
                <code className="text-red-900">{finding.code_snippet}</code>
              </pre>
            </div>

            <div className="flex items-center justify-center py-4">
              <div className="h-px bg-gray-300 flex-1"></div>
              <span className="px-6 text-sm font-bold text-gray-500 bg-gray-100 py-2 rounded-full">↓ TRANSFORMS TO ↓</span>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Proposed Fix
              </h4>
              <pre className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-sm overflow-x-auto">
                <code className="text-green-900">{patch?.suggestion || finding.recommended_fix}</code>
              </pre>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">?</div>
                Why This Fix Works
              </h4>
              <p className="text-sm text-blue-800 leading-relaxed">{finding.llm_analysis}</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-800 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
