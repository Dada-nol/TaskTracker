import { XPBar } from "@/components/XPBar";
import { CategoryCardProps } from "@/types";

export function CategoryCard({
  category,
  onNavigateToCategory,
  handleDelete,
  remaining,
}: CategoryCardProps) {
  return (
    <div
      onClick={() => onNavigateToCategory(category)}
      className="border border-black p-5 cursor-pointer hover:bg-gray-50 group relative"
    >
      <button
        onClick={(e) => handleDelete(category.id, e)}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-black text-sm font-mono"
        title="Supprimer"
      >
        ×
      </button>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xs font-mono uppercase tracking-widest font-bold">
          {category.name}
        </h2>
        <span className="text-xs font-mono text-gray-400">
          LVL {category.level}
        </span>
      </div>
      <XPBar
        currentXP={category.xp}
        xpToNextLevel={category.xp_to_next_level}
      />
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex gap-4">
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              Points
            </p>
            <p className="text-sm font-mono font-bold">
              {category.points_used_today}
              <span className="text-gray-300 font-normal">
                {" "}
                / {category.daily_point_limit}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              Jours actifs
            </p>
            <p className="text-sm font-mono font-bold">
              {category.active_days_this_month}j
            </p>
          </div>
        </div>
        {remaining === 0 ? (
          <span className="text-xs font-mono text-gray-400 border border-gray-200 px-2 py-0.5">
            COMPLET
          </span>
        ) : (
          <span className="text-xs font-mono text-gray-400">
            {remaining}pt restants
          </span>
        )}
      </div>
    </div>
  );
}
