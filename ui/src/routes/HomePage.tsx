import { getStats } from "@/api/schema";
import { DatabaseStatsCard } from "@/components/stats/DatabaseStatsCard";
import { data, useLoaderData } from "react-router";

export async function loader() {
  const { stats, error: statsError } = await getStats();
  if (statsError) {
    throw data(statsError.message, { status: statsError.code });
  }

  return { stats };
}

export function HomePage() {
  const { stats } = useLoaderData<typeof loader>();

  return (
    <>
      <title>{`Home`}</title>
      <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Welcome to pgPanel
      </h1>

      <DatabaseStatsCard stats={stats} />
    </>
  );
}
