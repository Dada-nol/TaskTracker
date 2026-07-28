import { SUGGESTED_CATEGORIES } from "@/constants/categories";
import { CategoryType } from "@/types";

interface IntegrationBlockProps {
  categoryType: CategoryType;
  hasNotion: boolean;
}

export function IntegrationBlock({
  categoryType,
  hasNotion,
}: IntegrationBlockProps) {
  const suggested = SUGGESTED_CATEGORIES.find(
    (s) => s.category_type === categoryType,
  );
  if (!suggested || suggested.integrations.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
          Intégrations
        </p>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <div className="space-y-3">
        {suggested.integrations.map((integ) => {
          const isConnected =
            (integ.id === "notion" && hasNotion) || integ.id === "github";
          const isAvailable = integ.id === "notion";

          return (
            <div
              key={integ.id}
              className="border border-gray-100 p-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono font-bold uppercase tracking-wider">
                  {integ.name}
                </p>
                <p className="text-xs font-mono text-gray-400 mt-0.5">
                  {integ.description}
                </p>
              </div>
              {isConnected ? (
                <span className="text-xs font-mono text-gray-400 border border-gray-200 px-2 py-1 flex-shrink-0">
                  Connecté
                </span>
              ) : isAvailable ? (
                <span className="text-xs font-mono text-gray-400 border border-dashed border-gray-200 px-2 py-1 flex-shrink-0">
                  Disponible
                </span>
              ) : (
                <span className="text-xs font-mono text-gray-300 border border-dashed border-gray-100 px-2 py-1 flex-shrink-0">
                  Bientôt
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
