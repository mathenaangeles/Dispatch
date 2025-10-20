export default function SeverityBadge({ severity }) {
  const colors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${colors[severity]}`}>
      {severity.toUpperCase()}
    </span>
  );
}