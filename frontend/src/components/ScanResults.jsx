export default function ScanResults({ report }) {
  if (!report) return <div className="text-gray-500">No results yet.</div>;
  if (report.error) return <pre className="bg-white p-4 rounded shadow">{JSON.stringify(report, null, 2)}</pre>;

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="font-semibold mb-2">Scan Results</h2>
      <pre className="text-sm max-h-[40vh] overflow-auto">{JSON.stringify(report, null, 2)}</pre>
    </div>
  );
}
