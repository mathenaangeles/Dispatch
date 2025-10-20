import { Shield, Clock } from 'lucide-react';

export default function Header({ lastScanTime }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dispatch</h1>
              <p className="text-xs text-gray-500">DevSecOps Agent</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Last Scan: {lastScanTime ? new Date(lastScanTime).toLocaleTimeString() : 'Never'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}