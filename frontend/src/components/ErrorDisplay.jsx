import { XCircle } from 'lucide-react';

export default function ErrorDisplay({ error }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900 mb-1">Scan Failed</h3>
          <p className="text-sm text-red-700">{JSON.stringify(error)}</p>
        </div>
      </div>
    </div>
  );
}