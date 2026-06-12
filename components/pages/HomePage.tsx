"use client";
import { useState } from "react";
import { Category } from "@/types";
import { XPBar } from "@/components/XPBar";
import { createCategory, deleteCategory } from "@/lib/db";

interface HomePageProps {
  categories: Category[];
  onNavigateToCategory: (cat: Category) => void;
  onCategoriesChange: (cats: Category[]) => void;
}

export function HomePage({ categories, onNavigateToCategory, onCategoriesChange }: HomePageProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [limit, setLimit] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const cat = await createCategory(name.trim(), limit);
      onCategoriesChange([...categories, cat]);
      setName("");
      setLimit(6);
      setShowForm(false);
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer cette catégorie et toutes ses tâches ?")) return;
    try {
      await deleteCategory(id);
      onCategoriesChange(categories.filter((c) => c.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">Tableau de bord</p>
          <h1 className="text-xl font-mono font-bold text-black">Mes catégories</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-mono uppercase tracking-wider border border-black px-4 py-2 hover:bg-black hover:text-white"
        >
          + Nouvelle catégorie
        </button>
      </div>

      {showForm && (
        <div className="border border-black p-5 mb-8 space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-500">Nouvelle catégorie</p>
          {error && <p className="text-xs font-mono text-black border border-black px-3 py-2">{error}</p>}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Nom de la catégorie..."
            className="w-full border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:border-black placeholder:text-gray-300"
            autoFocus
          />
          <div className="flex items-center gap-4">
            <label className="text-xs font-mono text-gray-500 uppercase tracking-wider whitespace-nowrap">
              Limite quotidienne
            </label>
            <div className="flex gap-2">
              {[4, 6, 8, 10, 12].map((v) => (
                <button
                  key={v}
                  onClick={() => setLimit(v)}
                  className={`w-10 h-8 text-xs font-mono border ${
                    limit === v ? "bg-black text-white border-black" : "border-gray-200 text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <span className="text-xs font-mono text-gray-400">pts/jour</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!name.trim() || loading}
              className="flex-1 py-2 text-sm font-mono bg-black text-white disabled:opacity-30 hover:bg-gray-800"
            >
              {loading ? "Création..." : "Créer"}
            </button>
            <button
              onClick={() => { setShowForm(false); setName(""); }}
              className="px-4 py-2 text-sm font-mono border border-gray-200 text-gray-500 hover:border-gray-400"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {categories.length === 0 && !showForm && (
        <div className="border border-dashed border-gray-200 p-16 text-center">
          <p className="text-sm font-mono text-gray-400">Aucune catégorie.</p>
          <p className="text-xs font-mono text-gray-300 mt-1">Crée ta première pour commencer.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const remaining = cat.daily_point_limit - cat.points_used_today;
          const pctUsed = Math.round((cat.points_used_today / cat.daily_point_limit) * 100);
          return (
            <div
              key={cat.id}
              onClick={() => onNavigateToCategory(cat)}
              className="border border-black p-5 cursor-pointer hover:bg-gray-50 group relative"
            >
              <button
                onClick={(e) => handleDelete(cat.id, e)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-black text-sm font-mono"
                title="Supprimer"
              >
                ×
              </button>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xs font-mono uppercase tracking-widest font-bold">{cat.name}</h2>
                <span className="text-xs font-mono text-gray-400">LVL {cat.level}</span>
              </div>
              <XPBar currentXP={cat.xp} xpToNextLevel={cat.xp_to_next_level} />
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex gap-4">
                  <div>
                    <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Points</p>
                    <p className="text-sm font-mono font-bold">
                      {cat.points_used_today}
                      <span className="text-gray-300 font-normal"> / {cat.daily_point_limit}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Streak</p>
                    <p className="text-sm font-mono font-bold">{cat.streak}j</p>
                  </div>
                </div>
                {remaining === 0 ? (
                  <span className="text-xs font-mono text-gray-400 border border-gray-200 px-2 py-0.5">COMPLET</span>
                ) : (
                  <span className="text-xs font-mono text-gray-400">{remaining}pt restants</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
