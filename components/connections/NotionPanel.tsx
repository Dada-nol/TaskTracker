"use client";
import { useState, useEffect } from "react";
import {
  Task,
  UserProfile,
  Category,
  NotionRow,
  Status,
  NotionPanelProps,
} from "@/types";
import { createNotionTask, getTodayNotionTask } from "@/lib/db";
import { EFFORT_LABELS, STATUS_COLORS, STATUSES } from "@/constants";

function parseRow(page: any): NotionRow {
  const p = page.properties;
  return {
    id: page.id,
    title: p["Idées"]?.title?.[0]?.plain_text ?? "—",
    type: p["Type"]?.select?.name ?? "—",
    effort: p["Niveau d'effort"]?.select?.name ?? "—",
    status: p["Status"]?.status?.name ?? "Idée",
    note: p["Note"]?.rich_text?.[0]?.plain_text ?? "",
    url: p["URL de la publication"]?.url ?? "",
  };
}

export function NotionPanel({
  category,
  profile,
  todayChallenge,
  onChallengeCreated,
}: NotionPanelProps) {
  const [rows, setRows] = useState<NotionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/notion")
      .then((r) => r.json())
      .then((data) => {
        if (data.results) setRows(data.results.map(parseRow));
        else setError("Impossible de charger les données Notion.");
      })
      .catch(() => setError("Erreur de connexion à Notion."))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: string, status: Status) => {
    setUpdating(id);
    try {
      await fetch("/api/notion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: id, status }),
      });
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch {
      setError("Erreur lors de la mise à jour.");
    } finally {
      setUpdating(null);
    }
  };

  const handlePick = async (row: NotionRow) => {
    if (todayChallenge) return;
    setPicking(row.id);
    try {
      const task = await createNotionTask(
        category.id,
        row.id,
        row.title,
        row.effort as "Faible" | "Moyen" | "Élevé",
      );
      onChallengeCreated(task);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPicking(null);
    }
  };

  if (loading)
    return (
      <p className="text-xs font-mono text-gray-400 py-4">
        Chargement Notion...
      </p>
    );
  if (error)
    return <p className="text-xs font-mono text-black py-4">{error}</p>;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-2">
        <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
          Notion — Idées Instagram
        </p>
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs font-mono text-gray-300">
          {rows.length} idées
        </span>
      </div>

      {todayChallenge ? (
        <div className="mb-4 border border-black px-4 py-3">
          <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">
            Défi du jour sélectionné
          </p>
          <p className="text-sm font-mono font-bold">{todayChallenge.title}</p>
          <p className="text-xs font-mono text-gray-400 mt-1">
            {todayChallenge.difficulty} · {todayChallenge.point_cost}pt · se
            réinitialise à minuit
          </p>
        </div>
      ) : (
        <p className="text-xs font-mono text-gray-400 mb-4">
          Clique sur une idée pour en faire ton défi du jour.
        </p>
      )}

      <div className="border border-gray-100 divide-y divide-gray-100">
        {rows.map((row) => {
          const isAlreadyPicked = todayChallenge?.notion_page_id === row.id;
          const canPick =
            (!todayChallenge || todayChallenge.completed) && !picking;

          if (row.status === "Postée") return null;

          return (
            <div
              key={row.id}
              className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${
                isAlreadyPicked
                  ? "bg-gray-50"
                  : canPick
                    ? "hover:bg-gray-50 cursor-pointer"
                    : ""
              }`}
              onClick={() => canPick && handlePick(row)}
            >
              {/* Titre */}
              <p
                className={`text-sm font-mono flex-1 min-w-0 truncate ${isAlreadyPicked ? "font-bold" : ""}`}
              >
                {isAlreadyPicked && "★ "}
                {row.title}
              </p>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {row.type !== "—" && (
                  <span className="text-xs font-mono text-gray-400 border border-gray-100 px-1.5 py-0.5">
                    {row.type}
                  </span>
                )}
                {row.effort !== "—" && (
                  <span className="text-xs font-mono text-gray-400 border border-gray-100 px-1.5 py-0.5">
                    {row.effort} · {EFFORT_LABELS[row.effort] ?? "?"}
                  </span>
                )}
              </div>

              {/* Note */}
              {row.note && (
                <p className="text-xs font-mono text-gray-400 truncate max-w-48 hidden lg:block">
                  {row.note}
                </p>
              )}

              {/* URL */}
              {row.url && (
                <a
                  href={row.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-mono text-gray-400 hover:text-black underline hidden lg:block"
                >
                  Lien
                </a>
              )}

              {/* Status */}
              <select
                value={row.status}
                disabled={updating === row.id}
                onChange={(e) => {
                  e.stopPropagation();
                  handleStatusChange(row.id, e.target.value as Status);
                }}
                onClick={(e) => e.stopPropagation()}
                className={`text-xs font-mono border-0 px-2 py-1 rounded-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-50 ${STATUS_COLORS[row.status] ?? "bg-gray-100 text-gray-500"}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {/* Bouton piocher */}
              {!todayChallenge && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePick(row);
                  }}
                  disabled={!!picking}
                  className="text-xs font-mono border border-black px-3 py-1 hover:bg-black hover:text-white disabled:opacity-30 flex-shrink-0"
                >
                  {picking === row.id ? "..." : "Piocher"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
