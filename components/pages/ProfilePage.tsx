"use client";
import { Category, UserProfile } from "@/types";
import { XPBar } from "@/components/XPBar";

interface ProfilePageProps {
  profile: UserProfile;
  categories: Category[];
}

function xpToNextLevel(level: number): number {
  return 500 * level;
}

export function ProfilePage({ profile, categories }: ProfilePageProps) {
  const memberSince = new Date(profile.created_at).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sortedByLevel = [...categories].sort((a, b) => b.level - a.level);
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  ).getDate();
  const bestActiveDays = Math.max(
    ...categories.map((c) => c.active_days_this_month),
    0,
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      {/* Global profile */}
      <div className="border border-black p-6">
        <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">
          Profil
        </p>
        <div className="flex items-baseline justify-between mb-5">
          <h1 className="text-xl font-mono font-bold">Niveau global</h1>
          <span className="text-3xl font-mono font-bold">{profile.level}</span>
        </div>
        <XPBar
          currentXP={profile.xp_total % xpToNextLevel(profile.level)}
          xpToNextLevel={xpToNextLevel(profile.level)}
          size="md"
        />
        <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              XP total
            </p>
            <p className="text-2xl font-mono font-bold">{profile.xp_total}</p>
          </div>
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              Catégories
            </p>
            <p className="text-2xl font-mono font-bold">{categories.length}</p>
          </div>
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              Meilleur mois
            </p>
            <p className="text-2xl font-mono font-bold">
              {bestActiveDays}
              <span className="text-gray-400 font-normal text-base"> j</span>
            </p>
          </div>
        </div>
        <p className="text-xs font-mono text-gray-300 mt-4">
          Membre depuis le {memberSince}
        </p>
      </div>

      {/* Jours actifs ce mois */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
            Jours actifs ce mois
          </p>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        {categories.length === 0 ? (
          <p className="text-sm font-mono text-gray-300">Aucune catégorie.</p>
        ) : (
          <div className="space-y-3">
            {[...categories]
              .sort(
                (a, b) => b.active_days_this_month - a.active_days_this_month,
              )
              .map((cat) => {
                const pct = Math.round(
                  (cat.active_days_this_month / daysInMonth) * 100,
                );
                return (
                  <div key={cat.id} className="border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono uppercase tracking-wider">
                        {cat.name}
                      </span>
                      <span className="text-sm font-mono font-bold">
                        {cat.active_days_this_month}
                        <span className="text-gray-300 font-normal">
                          {" "}
                          / {daysInMonth}j
                        </span>
                      </span>
                    </div>
                    <div className="h-1 w-full bg-gray-100">
                      <div
                        className="h-full bg-black"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {cat.last_active_date && (
                      <p className="text-xs font-mono text-gray-300 mt-1">
                        Dernière activité :{" "}
                        {new Date(cat.last_active_date).toLocaleDateString(
                          "fr-FR",
                        )}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Niveaux par catégorie */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
            Niveaux par catégorie
          </p>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        {categories.length === 0 ? (
          <p className="text-sm font-mono text-gray-300">Aucune catégorie.</p>
        ) : (
          <div className="space-y-3">
            {sortedByLevel.map((cat) => (
              <div key={cat.id} className="border border-gray-100 p-4">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-xs font-mono uppercase tracking-wider">
                    {cat.name}
                  </span>
                  <span className="text-xs font-mono text-gray-400">
                    LVL {cat.level}
                  </span>
                </div>
                <XPBar
                  currentXP={cat.xp}
                  xpToNextLevel={cat.xp_to_next_level}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Points aujourd'hui */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
            Points aujourd'hui
          </p>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <div className="space-y-3">
          {categories.map((cat) => {
            const pct = Math.round(
              (cat.points_used_today / cat.daily_point_limit) * 100,
            );
            return (
              <div key={cat.id} className="border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider">
                    {cat.name}
                  </span>
                  <span className="text-xs font-mono text-gray-500">
                    {cat.points_used_today} / {cat.daily_point_limit} pts
                  </span>
                </div>
                <div className="h-1 w-full bg-gray-100">
                  <div
                    className="h-full bg-black"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
