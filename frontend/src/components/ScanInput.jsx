import { 
  GitBranch, 
  FileCode, 
  Play, 
  Loader2, 
  Link, 
  FolderOpen, 
  SearchCode 
} from 'lucide-react';

const Spinner = ({ className }) => (
  <Loader2 className={`animate-spin w-5 h-5 ${className || ''}`} />
);

export default function ScanInput({ 
  input, 
  setInput, 
  isRepo, 
  setIsRepo, 
  onScan, 
  loading,
  lastScanDuration = null 
}) {
  const buttonText = isRepo ? 'Scan Repository' : 'Scan Local Path';
  const placeholderText = isRepo 
    ? 'Enter Git repository URL (e.g., https://github.com/org/repository)' 
    : 'Enter local project path (e.g., /path/to/project)';
    
  const InputIcon = isRepo ? Link : FolderOpen;

  const durationDisplay = lastScanDuration 
    ? `Scan Duration: ${lastScanDuration}s` 
    : '';

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-lg w-full">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <SearchCode className="w-5 h-5 text-blue-600" />
          Start New Scan
        </h2>
        
        {durationDisplay && (
          <p className="text-xs font-medium text-gray-600 whitespace-nowrap">
            {durationDisplay}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="inline-flex rounded-lg bg-gray-100 p-1 space-x-1 flex-shrink-0">
          <button
            onClick={() => setIsRepo(true)}
            className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              isRepo
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            disabled={loading}
          >
            <GitBranch className="w-4 h-4" />
            Git Repository
          </button>
          
          <button
            onClick={() => setIsRepo(false)}
            className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              !isRepo
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            disabled={loading}
          >
            <FileCode className="w-4 h-4" />
            Local Path
          </button>
        </div>

        <div className="relative flex-grow min-w-[200px]">
          <InputIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder={placeholderText}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading && input.trim()) {
                onScan();
              }
            }}
          />
        </div>

        <button
          onClick={onScan}
          disabled={loading || !input.trim()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm flex-shrink-0"
        >
          {loading ? <Spinner /> : <Play className="w-4 h-4" />}
          {loading ? 'Scanning...' : buttonText}
        </button>
      </div>
    </div>
  );
}
