"use client";
import { useState, useEffect } from "react";
import { GitHubActivity, Category, UserProfile } from "@/types";
import { syncGitHubCommits } from "@/lib/db";

interface GitHubPanelProps {
  category: Category;
  profile: UserProfile;
  onCategoryUpdate: (cat: Category) => void;
  onProfileUpdate: (profile: UserProfile) => void;
}

export function GitHubPanel({
  category,
  profile,
  onCategoryUpdate,
  onProfileUpdate,
}: GitHubPanelProps) {
  const [activity, setActivity] = useState<GitHubActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [newCount, setNewCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/github");
        const data = await res.json();

        if (!Array.isArray(data)) {
          setError("Impossible de charger l'activité GitHub.");
          return;
        }

        setActivity(data);

        // Sync automatique au chargement
        setSyncing(true);
        const allCommits = data.flatMap((day: GitHubActivity) => day.commits);
        const {
          updatedCategory,
          updatedProfile,
          newCount: count,
        } = await syncGitHubCommits(category.id, category, profile, allCommits);

        if (count > 0) {
          onCategoryUpdate(updatedCategory);
          onProfileUpdate(updatedProfile);
          setNewCount(count);
        }
      } catch {
        setError("Erreur de connexion à GitHub.");
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    };

    load();
  }, [category.id]);

  if (loading)
    return (
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
            GitHub
          </p>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <p className="text-xs font-mono text-gray-300 py-4">
          {syncing ? "Synchronisation des commits..." : "Chargement..."}
        </p>
      </div>
    );

  if (error)
    return (
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
            GitHub
          </p>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <p className="text-xs font-mono text-black py-4">{error}</p>
      </div>
    );

  const totalCommits = activity.reduce((a, d) => a + d.commits.length, 0);

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
          GitHub
        </p>
        <div className="flex-1 h-px bg-gray-100" />
        <div className="flex items-center gap-3">
          {newCount !== null && newCount > 0 && (
            <span className="text-xs font-mono text-gray-400">
              +{newCount} commit{newCount > 1 ? "s" : ""} importé
              {newCount > 1 ? "s" : ""}
            </span>
          )}
          {newCount === 0 && (
            <span className="text-xs font-mono text-gray-300">À jour</span>
          )}
          <span className="text-xs font-mono text-gray-300">
            {activity.length}j · {totalCommits} commits
          </span>
        </div>
      </div>

      {activity.length === 0 ? (
        <p className="text-sm font-mono text-gray-300 py-4">
          Aucun commit ces 30 derniers jours.
        </p>
      ) : (
        <div className="border border-gray-100 divide-y divide-gray-100">
          {activity.map((day) => {
            const isExpanded = expandedDate === day.date;
            const d = new Date(day.date + "T00:00:00");
            const label = d.toLocaleDateString("fr-FR", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });

            return (
              <div key={day.date}>
                <button
                  onClick={() => setExpandedDate(isExpanded ? null : day.date)}
                  className="w-full px-4 py-3 flex items-center gap-4 hover:bg-gray-50 text-left"
                >
                  <span className="text-xs font-mono text-gray-400 w-28 flex-shrink-0">
                    {label}
                  </span>
                  <div className="flex-1 flex gap-1 flex-wrap">
                    {Array.from(new Set(day.commits.map((c) => c.repo))).map(
                      (repo) => (
                        <span
                          key={repo}
                          className="text-xs font-mono text-gray-400 border border-gray-100 px-1.5 py-0.5"
                        >
                          {repo}
                        </span>
                      ),
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold flex-shrink-0">
                    {day.commits.length} commit
                    {day.commits.length > 1 ? "s" : ""}
                  </span>
                  <span className="text-xs font-mono text-gray-300 flex-shrink-0">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {day.commits.map((commit) => (
                      <div
                        key={commit.sha}
                        className="px-4 py-2.5 flex items-start gap-4 bg-gray-50"
                      >
                        <span className="text-xs font-mono text-gray-300 flex-shrink-0 mt-0.5">
                          {new Date(commit.time).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-xs font-mono text-gray-400 border border-gray-200 px-1.5 py-0.5 flex-shrink-0">
                          {commit.repo}
                        </span>
                        <span className="text-xs font-mono text-black flex-1 min-w-0 truncate">
                          {commit.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
