"use client";
import { useState } from "react";
import { Category, CategoryType } from "@/types";
import { createCategory, deleteCategory } from "@/lib/db";
import {
  SUGGESTED_CATEGORIES,
  SuggestedCategory,
} from "@/constants/categories";
import { CategoryCard } from "./home/CategoryCard";
import CategoryForm from "./home/CategoryForm";

interface HomePageProps {
  categories: Category[];
  onNavigateToCategory: (cat: Category) => void;
  onCategoriesChange: (cats: Category[]) => void;
}

export function HomePage({
  categories,
  onNavigateToCategory,
  onCategoriesChange,
}: HomePageProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [limit, setLimit] = useState(6);
  const [loading, setLoading] = useState(false);
  const [addingSlug, setAddingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFirstVisit = categories.length === 0;

  const handleCreate = async (
    catName: string,
    catLimit: number,
    catType: CategoryType = null,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const cat = await createCategory(catName, catLimit, catType);
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

  const handleAddSuggested = async (suggested: SuggestedCategory) => {
    setAddingSlug(suggested.name);
    setError(null);
    try {
      const cat = await createCategory(
        suggested.name,
        suggested.daily_point_limit,
        suggested.category_type,
      );
      onCategoriesChange([...categories, cat]);
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de la création");
    } finally {
      setAddingSlug(null);
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

  const existingTypes = new Set(categories.map((c) => c.category_type));
  const remainingSuggestions = SUGGESTED_CATEGORIES.filter(
    (s) => !existingTypes.has(s.category_type),
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* ── Premier lancement ── */}
      {isFirstVisit && (
        <div className="mb-12">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">
            Bienvenue
          </p>
          <h1 className="text-xl font-mono font-bold mb-1">
            Par où tu veux commencer ?
          </h1>
          <p className="text-sm font-mono text-gray-500 mb-8">
            Choisis une ou plusieurs catégories pour démarrer, ou crée la
            tienne.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {SUGGESTED_CATEGORIES.map((suggested) => (
              <div
                key={suggested.name}
                className="border border-gray-200 p-5 flex flex-col gap-3"
              >
                <div>
                  <p className="text-xs font-mono font-bold uppercase tracking-widest mb-1">
                    {suggested.name}
                  </p>
                  <p className="text-xs font-mono text-gray-400">
                    {suggested.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-gray-300 border border-gray-100 px-2 py-0.5">
                    {suggested.daily_point_limit}pt / jour
                  </span>
                  {suggested.integrations.map((integ) => (
                    <span
                      key={integ.id}
                      className="text-xs font-mono text-gray-300 border border-gray-100 px-2 py-0.5"
                    >
                      {integ.name}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleAddSuggested(suggested)}
                  disabled={addingSlug === suggested.name}
                  className="mt-auto text-xs font-mono uppercase tracking-wider border border-black px-4 py-2 hover:bg-black hover:text-white disabled:opacity-30"
                >
                  {addingSlug === suggested.name
                    ? "Ajout..."
                    : `+ Ajouter ${suggested.name}`}
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-6">
            <button
              onClick={() => setShowForm(true)}
              className="text-xs font-mono text-gray-400 hover:text-black uppercase tracking-wider"
            >
              + Créer une catégorie personnalisée
            </button>
          </div>
        </div>
      )}

      {/* ── Vue normale (catégories existantes) ── */}
      {!isFirstVisit && (
        <>
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">
                Tableau de bord
              </p>
              <h1 className="text-xl font-mono font-bold">Mes catégories</h1>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-xs font-mono uppercase tracking-wider border border-black px-4 py-2 hover:bg-black hover:text-white"
            >
              + Nouvelle catégorie
            </button>
          </div>

          {/* Suggestions restantes */}
          {remainingSuggestions.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
                  Suggestions
                </p>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="flex gap-3 flex-wrap">
                {remainingSuggestions.map((suggested) => (
                  <button
                    key={suggested.name}
                    onClick={() => handleAddSuggested(suggested)}
                    disabled={addingSlug === suggested.name}
                    className="text-xs font-mono border border-dashed border-gray-300 px-4 py-2 text-gray-500 hover:border-black hover:text-black disabled:opacity-30"
                  >
                    {addingSlug === suggested.name
                      ? "Ajout..."
                      : `+ ${suggested.name}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Formulaire création custom */}
      {showForm && (
        <CategoryForm
          error={error}
          name={name}
          setName={setName}
          handleCreate={handleCreate}
          limit={limit}
          setLimit={setLimit}
          loading={loading}
          setShowForm={setShowForm}
        />
      )}

      {/* Grille de catégories */}
      {!isFirstVisit && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const remaining = cat.daily_point_limit - cat.points_used_today;
            return (
              <CategoryCard
                key={cat.id}
                category={cat}
                onNavigateToCategory={onNavigateToCategory}
                handleDelete={handleDelete}
                remaining={remaining}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
