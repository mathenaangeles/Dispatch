import { FileCode, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import StatCard from './StatCard';

export default function StatsOverview({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={FileCode}
        label="Files Scanned"
        value={stats?.total_files_scanned || 0}
        color="blue"
      />
      <StatCard
        icon={AlertTriangle}
        label="Total Findings"
        value={stats?.total_findings || 0}
        color="yellow"
      />
      <StatCard
        icon={XCircle}
        label="High Severity"
        value={stats?.high_severity || 0}
        color="red"
      />
      <StatCard
        icon={CheckCircle}
        label="Auto-Fixable"
        value={stats?.auto_fixable || 0}
        color="green"
      />
    </div>
  );
}