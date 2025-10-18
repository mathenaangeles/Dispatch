export default function PatchViewer({ patch }) {
  if (!patch) return null;
  return (
    <div className="bg-white p-4 rounded shadow mt-4">
      <h3 className="font-medium">Proposed Patch</h3>
      <pre className="text-sm whitespace-pre-wrap">{patch}</pre>
    </div>
  );
}
