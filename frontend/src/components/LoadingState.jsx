export default function LoadingState() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg w-full relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 animate-pulse"></div>
      <div className="flex items-center justify-center gap-4 p-8 pt-9"> 
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-transparent border-blue-600"></div>
        <div>
          <div className="text-lg font-bold text-gray-900">Scanning Repository...</div>
          <div className="text-sm text-gray-600">Please wait while I reviewing your code for security risks and generate solutions.</div>
        </div>
      </div>
    </div>
  );
}
