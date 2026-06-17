"use client";
import { useState, useEffect } from "react";
import {
  Category,
  DailySnapshot,
  HistoryPageProps,
  PieSlice,
  TaskCompletion,
} from "@/types";
import { getCompletionsByPeriod, getSnapshots } from "@/lib/db";
import { Spinner } from "@/components/Spinner";
import { Period, ViewMode, CAT_COLORS, PERIODS, BAR_HEIGHT } from "@/constants";

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

function PieChart({
  slices,
  size = 120,
}: {
  slices: PieSlice[];
  size?: number;
}) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 2}
          fill="#f3f4f6"
          stroke="#e5e7eb"
          strokeWidth={1}
        />
        <text
          x={size / 2}
          y={size / 2 + 4}
          textAnchor="middle"
          fontSize="10"
          fill="#9ca3af"
          fontFamily="monospace"
        >
          0pt
        </text>
      </svg>
    );
  }

  let cumulative = 0;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;

  const paths = slices
    .filter((s) => s.value > 0)
    .map((slice) => {
      const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
      cumulative += slice.value;
      const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArc = slice.value / total > 0.5 ? 1 : 0;

      if (slice.value === total) {
        return (
          <circle key={slice.label} cx={cx} cy={cy} r={r} fill={slice.color} />
        );
      }

      return (
        <path
          key={slice.label}
          d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
          fill={slice.color}
        />
      );
    });

  return (
    <svg width={size} height={size}>
      {paths}
      <circle cx={cx} cy={cy} r={r * 0.45} fill="white" />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize="11"
        fill="#111"
        fontFamily="monospace"
        fontWeight="bold"
      >
        {total}pt
      </text>
    </svg>
  );
}

export function HistoryPage({ categories }: HistoryPageProps) {
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>(30);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([getSnapshots(period), getCompletionsByPeriod(period)])
      .then(([snaps, comps]) => {
        setSnapshots(snaps);
        setCompletions(comps);
      })
      .finally(() => setLoading(false));
  }, [period]);

  const byDate = groupByDate(snapshots);
  const dates = Object.keys(byDate).sort();

  const catColorMap: Record<string, string> = {};
  categories.forEach((cat, i) => {
    catColorMap[cat.id] = CAT_COLORS[i % CAT_COLORS.length];
  });

  const totalPoints = snapshots.reduce((a, s) => a + s.points_used, 0);
  const totalTasks = snapshots.reduce((a, s) => a + s.tasks_completed, 0);
  const activeDays = dates.length;
  const avgCompletion =
    snapshots.length === 0
      ? 0
      : Math.round(
          snapshots.reduce(
            (a, s) => a + (s.points_used / s.points_limit) * 100,
            0,
          ) / snapshots.length,
        );

  const catTotals = categories.map((cat, i) => {
    const catSnaps = snapshots.filter((s) => s.category_id === cat.id);
    const points = catSnaps.reduce((a, s) => a + s.points_used, 0);
    const activeDaysCat = catSnaps.filter((s) => s.points_used > 0).length;
    const inactiveDays = catSnaps.filter((s) => s.points_used === 0).length;
    const avgComp =
      catSnaps.length === 0
        ? 0
        : Math.round(
            catSnaps.reduce(
              (a, s) => a + (s.points_used / s.points_limit) * 100,
              0,
            ) / catSnaps.length,
          );
    return {
      cat,
      points,
      activeDaysCat,
      inactiveDays,
      avgComp,
      color: CAT_COLORS[i % CAT_COLORS.length],
    };
  });

  const maxDayOverview = Math.max(
    ...dates.map((d) => byDate[d].reduce((a, s) => a + s.points_used, 0)),
    1,
  );
  const maxDayBreakdown = Math.max(...snapshots.map((s) => s.points_used), 1);

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
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-mono border ${period === p ? "bg-black text-white border-black" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
              >
                {p}j
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(
              [
                ["overview", "Vue d'ensemble"],
                ["breakdown", "Par catégorie"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-mono border ${viewMode === mode ? "bg-black text-white border-black" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
              >
                {label}
              </button>
            ))}
          </div>
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
              { label: "Points totaux", value: totalPoints },
              { label: "Tâches complétées", value: totalTasks },
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

          {/* Légende */}
          <div className="flex gap-4 flex-wrap">
            {categories.map((cat, i) => (
              <div key={cat.id} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 flex-shrink-0"
                  style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }}
                />
                <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>

          {/* ── VUE D'ENSEMBLE ── */}
          {viewMode === "overview" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Baton d'ensemble */}
                <div className="lg:col-span-2">
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">
                    Points par jour
                  </p>
                  {dates.length === 0 ? (
                    <p className="text-sm font-mono text-gray-300 py-8 text-center">
                      Aucune donnée.
                    </p>
                  ) : (
                    <div className="border border-gray-100 p-4 overflow-x-auto">
                      <div
                        className="flex items-end gap-1 min-w-max"
                        style={{ height: BAR_HEIGHT + 40 }}
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
                          const barH = Math.max(
                            2,
                            Math.round((total / maxDayOverview) * BAR_HEIGHT),
                          );
                          const completion =
                            limit > 0 ? Math.round((total / limit) * 100) : 0;
                          return (
                            <div
                              key={date}
                              className="flex flex-col items-center gap-1 group relative"
                            >
                              <div className="absolute bottom-8 mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                                <div className="bg-black text-white text-xs font-mono px-2 py-1 whitespace-nowrap">
                                  {formatDate(date)}
                                  <br />
                                  {total}pt · {completion}%
                                </div>
                              </div>
                              <div
                                className="w-6 bg-black"
                                style={{ height: barH }}
                              />
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

                {/* Camembert global */}
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">
                    Répartition globale
                  </p>
                  <div className="border border-gray-100 p-4 flex flex-col items-center gap-4">
                    <PieChart
                      size={140}
                      slices={catTotals.map((c) => ({
                        label: c.cat.name,
                        value: c.points,
                        color: c.color,
                      }))}
                    />
                    <div className="w-full space-y-1">
                      {catTotals.map(({ cat, points, color }) => (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs font-mono text-gray-500">
                              {cat.name}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold">
                            {points}pt
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Taux de complétion journalier */}
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

              {/* Journal des complétions */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
                    Journal des complétions
                  </p>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs font-mono text-gray-300">
                    {completions.length} tâches
                  </span>
                </div>
                {completions.length === 0 ? (
                  <p className="text-sm font-mono text-gray-300 py-4 text-center">
                    Aucune complétion sur cette période.
                  </p>
                ) : (
                  <div className="border border-gray-100 divide-y divide-gray-100">
                    {completions.map((c) => {
                      const cat = categories.find(
                        (cat) => cat.id === c.category_id,
                      );
                      const catIndex = categories.findIndex(
                        (cat) => cat.id === c.category_id,
                      );
                      const color = CAT_COLORS[catIndex % CAT_COLORS.length];
                      return (
                        <div
                          key={c.id}
                          className="px-4 py-3 flex items-center gap-4"
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-mono flex-1 truncate">
                            {c.title}
                          </span>
                          <span className="text-xs font-mono text-gray-400 hidden sm:block">
                            {cat?.name}
                          </span>
                          <span className="text-xs font-mono text-gray-400 border border-gray-100 px-1.5 py-0.5">
                            {c.difficulty}
                          </span>
                          <span className="text-xs font-mono text-gray-400">
                            {c.point_cost}pt
                          </span>
                          <span className="text-xs font-mono text-gray-300 flex-shrink-0">
                            {new Date(c.completed_at).toLocaleDateString(
                              "fr-FR",
                              { day: "numeric", month: "short" },
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── VUE PAR CATÉGORIE ── */}
          {viewMode === "breakdown" && (
            <>
              {/* Batons groupés */}
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">
                  Points par jour — par catégorie
                </p>
                {dates.length === 0 ? (
                  <p className="text-sm font-mono text-gray-300 py-8 text-center">
                    Aucune donnée.
                  </p>
                ) : (
                  <div className="border border-gray-100 p-4 overflow-x-auto">
                    <div
                      className="flex items-end gap-3 min-w-max"
                      style={{ height: BAR_HEIGHT + 40 }}
                    >
                      {dates.map((date) => {
                        const daySnaps = byDate[date];
                        return (
                          <div
                            key={date}
                            className="flex flex-col items-center gap-1"
                          >
                            <div className="flex items-end gap-0.5">
                              {categories.map((cat, i) => {
                                const snap = daySnaps.find(
                                  (s) => s.category_id === cat.id,
                                );
                                const pts = snap?.points_used ?? 0;
                                const barH =
                                  pts === 0
                                    ? 2
                                    : Math.max(
                                        3,
                                        Math.round(
                                          (pts / maxDayBreakdown) * BAR_HEIGHT,
                                        ),
                                      );
                                const color =
                                  pts === 0
                                    ? "#e5e7eb"
                                    : CAT_COLORS[i % CAT_COLORS.length];
                                return (
                                  <div
                                    key={cat.id}
                                    title={`${cat.name}: ${pts}pt`}
                                    className="w-4"
                                    style={{
                                      height: barH,
                                      backgroundColor: color,
                                    }}
                                  />
                                );
                              })}
                            </div>
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

              {/* Camembert par catégorie */}
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">
                  Activité par catégorie
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {catTotals.map(
                    ({
                      cat,
                      activeDaysCat,
                      inactiveDays,
                      avgComp,
                      color,
                      points,
                    }) => {
                      const totalDays = activeDaysCat + inactiveDays;
                      return (
                        <div
                          key={cat.id}
                          className="border border-gray-100 p-4 flex flex-col items-center gap-3"
                        >
                          <p className="text-xs font-mono uppercase tracking-wider text-center">
                            {cat.name}
                          </p>
                          <PieChart
                            size={100}
                            slices={[
                              { label: "Actif", value: activeDaysCat, color },
                              {
                                label: "Inactif",
                                value: inactiveDays,
                                color: "#e5e7eb",
                              },
                            ]}
                          />
                          <div className="w-full space-y-1 text-center">
                            <p className="text-xs font-mono text-gray-400">
                              <span className="font-bold text-black">
                                {activeDaysCat}
                              </span>{" "}
                              / {totalDays}j actifs
                            </p>
                            <p className="text-xs font-mono text-gray-400">
                              taux moyen{" "}
                              <span className="font-bold text-black">
                                {avgComp}%
                              </span>
                            </p>
                            <p className="text-xs font-mono text-gray-400">
                              <span className="font-bold text-black">
                                {points}pt
                              </span>{" "}
                              total
                            </p>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Détail comparatif */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
                    Détail par catégorie
                  </p>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="space-y-3">
                  {catTotals.map(
                    ({ cat, points, activeDaysCat, avgComp, color }) => {
                      const maxPts = Math.max(
                        ...catTotals.map((c) => c.points),
                        1,
                      );
                      return (
                        <div
                          key={cat.id}
                          className="border border-gray-100 p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-xs font-mono uppercase tracking-wider">
                                {cat.name}
                              </span>
                            </div>
                            <div className="flex gap-4">
                              <span className="text-xs font-mono text-gray-400">
                                {activeDaysCat}j actifs
                              </span>
                              <span className="text-xs font-mono text-gray-400">
                                {avgComp}% completion
                              </span>
                              <span className="text-xs font-mono font-bold">
                                {points}pt
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100">
                            <div
                              className="h-full"
                              style={{
                                width: `${Math.round((points / maxPts) * 100)}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
