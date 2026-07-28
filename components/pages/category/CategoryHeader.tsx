import { Category } from "@/types";
import { XPBar } from "@/components/XPBar";

interface CategoryHeaderProps {
  category: Category;
  completedCount: number;
  totalCount: number;
}

export function CategoryHeader({
  category,
  completedCount,
  totalCount,
}: CategoryHeaderProps) {
  const remaining = category.daily_point_limit - category.points_used_today;

  return (
    <div className="border border-black p-6 mb-6">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-xs font-mono uppercase tracking-widest font-bold">
          {category.name}
        </h1>
        <span className="text-xs font-mono text-gray-400">
          LVL {category.level}
        </span>
      </div>
      <XPBar
        currentXP={category.xp}
        xpToNextLevel={category.xp_to_next_level}
        size="md"
      />
      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
            Utilisés
          </p>
          <p className="text-lg font-mono font-bold">
            {category.points_used_today}
            <span className="text-gray-300 font-normal text-sm">
              {" "}
              / {category.daily_point_limit}
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
            Restants
          </p>
          <p
            className={`text-lg font-mono font-bold ${remaining === 0 ? "text-gray-400" : "text-black"}`}
          >
            {remaining}pt
          </p>
        </div>
        <div>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
            Complétés
          </p>
          <p className="text-lg font-mono font-bold">
            {completedCount}
            <span className="text-gray-300 font-normal text-sm">
              {" "}
              / {totalCount}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
