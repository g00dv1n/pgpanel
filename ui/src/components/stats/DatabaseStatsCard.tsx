import { DatabaseSchemaStats } from "@/lib/schemaStats";

interface DatabaseStatsCardProps {
  stats: DatabaseSchemaStats;
}

export function DatabaseStatsCard({ stats }: DatabaseStatsCardProps) {
  return (
    <div className="my-4">
      <div className="text-lg my-2">
        <div>
          <span>database: </span>
          <span className="font-semibold">{stats.dbName}</span>
        </div>
        <div>
          <span>schema: </span>
          <span className="font-semibold">{stats.schemaName}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 my-4">
        <StatCard title="Total Tables" value={stats.tablesCount.toLocaleString()} />
        <StatCard title="Total Rows" value={stats.totalRows.toLocaleString()} />
        <StatCard title="Database Size" value={stats.sizePretty} />
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: string;
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
