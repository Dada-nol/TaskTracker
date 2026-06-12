"use client";
import { useState, useEffect } from "react";
import { Category, DailySnapshot } from "@/types";
import { getSnapshots } from "@/lib/db";
import { Spinner } from "@/components/Spinner";

interface HistoryPageProps {
  categories: Category[];
}

const BAR_HEIGHT = 120;
const PERIODS = [7, 30, 90] as const;
type Period = (typeof PERIODS)[number];

function groupByDate(
  snapshots: DailySnapshot[],
): Record<string, DailySnapshot[]> {
  return snapshots.reduce(
    (acc, s) => {
      if (!acc[s.date]) acc[s.date] = [];
      acc[s.date].push(s);
      return acc;
    },
    {} as Record<string, DailySnapshot[]>,
  );
}

function formatDate(dateStr: string, short = false): string {
  const d = new Date(dateStr + "T00:00:00");
  if (short)
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function HistoryPage({ categories }: HistoryPageProps) {
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>(30);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  useEffect(() => {
    getSnapshots(period)
      .then(setSnapshots)
      .finally(() => setLoading(false));
  }, [period]);

  const filtered =
    selectedCategoryId === "all"
      ? snapshots
      : snapshots.filter((s) => s.category_id === selectedCategoryId);

  const byDate = groupByDate(filtered);
  const dates = Object.keys(byDate).sort();

  // Stats globales
  const totalPointsAll = filtered.reduce((a, s) => a + s.points_used, 0);
  const totalTasksAll = filtered.reduce((a, s) => a + s.tasks_completed, 0);
  const activeDays = dates.length;
  const avgCompletion =
    filtered.length === 0
      ? 0
      : Math.round(
          filtered.reduce(
            (a, s) => a + (s.points_used / s.points_limit) * 100,
            0,
          ) / filtered.length,
        );

  // Comparaison catégories
  const catTotals = categories
    .map((cat) => {
      const catSnaps = snapshots.filter((s) => s.category_id === cat.id);
      return {
        cat,
        points: catSnaps.reduce((a, s) => a + s.points_used, 0),
        days: new Set(catSnaps.map((s) => s.date)).size,
        avgCompletion:
          catSnaps.length === 0
            ? 0
            : Math.round(
                catSnaps.reduce(
                  (a, s) => a + (s.points_used / s.points_limit) * 100,
                  0,
                ) / catSnaps.length,
              ),
      };
    })
    .sort((a, b) => b.points - a.points);

  const maxCatPoints = Math.max(...catTotals.map((c) => c.points), 1);

  // Graphique points par jour
  const maxDayPoints = Math.max(
    ...dates.map((d) => byDate[d].reduce((a, s) => a + s.points_used, 0)),
    1,
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">
            Dashboard
          </p>
          <h1 className="text-xl font-mono font-bold">Historique</h1>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                setLoading(true);
              }}
              className={`px-3 py-1.5 text-xs font-mono border ${
                period === p
                  ? "bg-black text-white border-black"
                  : "border-gray-200 text-gray-500 hover:border-gray-400"
              }`}
            >
              {p}j
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          {/* Stats globales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Jours actifs", value: `${activeDays}j` },
              { label: "Points totaux", value: totalPointsAll },
              { label: "Tâches complétées", value: totalTasksAll },
              { label: "Taux moyen", value: `${avgCompletion}%` },
            ].map(({ label, value }) => (
              <div key={label} className="border border-gray-100 p-4">
                <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-2xl font-mono font-bold mt-1">{value}</p>
              </div>
            ))}
          </div>

          {/* Graphique points par jour */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
                  Points par jour
                </p>
                <div className="h-px flex-1 bg-gray-100 w-16" />
              </div>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="text-xs font-mono border border-gray-200 px-2 py-1 focus:outline-none focus:border-black"
              >
                <option value="all">Toutes les catégories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {dates.length === 0 ? (
              <p className="text-sm font-mono text-gray-300 py-8 text-center">
                Aucune donnée sur cette période.
              </p>
            ) : (
              <div className="border border-gray-100 p-4 overflow-x-auto">
                <div
                  className="flex items-end gap-1 min-w-max"
                  style={{ height: BAR_HEIGHT + 32 }}
                >
                  {dates.map((date) => {
                    const daySnaps = byDate[date];
                    const total = daySnaps.reduce(
                      (a, s) => a + s.points_used,
                      0,
                    );
                    const limit = daySnaps.reduce(
                      (a, s) => a + s.points_limit,
                      0,
                    );
                    const pct = Math.round((total / maxDayPoints) * BAR_HEIGHT);
                    const completion =
                      limit > 0 ? Math.round((total / limit) * 100) : 0;

                    return (
                      <div
                        key={date}
                        className="flex flex-col items-center gap-1 group relative"
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10">
                          <div className="bg-black text-white text-xs font-mono px-2 py-1 whitespace-nowrap">
                            {formatDate(date)}
                            <br />
                            {total}pt · {completion}%
                          </div>
                        </div>
                        <div className="w-6 bg-black" style={{ height: pct }} />
                        <p className="text-xs font-mono text-gray-300 rotate-45 origin-left translate-y-3 translate-x-1 whitespace-nowrap">
                          {formatDate(date, true)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Comparaison catégories */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
                Comparaison catégories
              </p>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="space-y-3">
              {catTotals.map(({ cat, points, days, avgCompletion: avg }) => (
                <div key={cat.id} className="border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider">
                      {cat.name}
                    </span>
                    <div className="flex gap-4">
                      <span className="text-xs font-mono text-gray-400">
                        {days}j actifs
                      </span>
                      <span className="text-xs font-mono text-gray-400">
                        {avg}% completion
                      </span>
                      <span className="text-xs font-mono font-bold">
                        {points}pt
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100">
                    <div
                      className="h-full bg-black"
                      style={{
                        width: `${Math.round((points / maxCatPoints) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Taux de complétion par jour */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
                Taux de complétion journalier
              </p>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            {dates.length === 0 ? (
              <p className="text-sm font-mono text-gray-300 py-4 text-center">
                Aucune donnée.
              </p>
            ) : (
              <div className="border border-gray-100 divide-y divide-gray-100">
                {[...dates]
                  .reverse()
                  .slice(0, 14)
                  .map((date) => {
                    const daySnaps = byDate[date];
                    const total = daySnaps.reduce(
                      (a, s) => a + s.points_used,
                      0,
                    );
                    const limit = daySnaps.reduce(
                      (a, s) => a + s.points_limit,
                      0,
                    );
                    const pct =
                      limit > 0 ? Math.round((total / limit) * 100) : 0;
                    return (
                      <div
                        key={date}
                        className="px-4 py-3 flex items-center gap-4"
                      >
                        <span className="text-xs font-mono text-gray-400 w-28 flex-shrink-0">
                          {formatDate(date)}
                        </span>
                        <div className="flex-1 h-1.5 bg-gray-100">
                          <div
                            className="h-full bg-black"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold w-10 text-right">
                          {pct}%
                        </span>
                        <span className="text-xs font-mono text-gray-400 w-16 text-right">
                          {total}/{limit}pt
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
