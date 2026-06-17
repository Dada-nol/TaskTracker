"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import {
  getCategories,
  getOrCreateProfile,
  resetDailyIfNeeded,
} from "@/lib/db";
import { Category, UserProfile, Page } from "@/types";
import { Navbar } from "@/components/Navbar";
import { Spinner } from "@/components/Spinner";
import { HomePage } from "@/components/pages/HomePage";
import { CategoryPage } from "@/components/pages/CategoryPage";
import { ProfilePage } from "@/components/pages/ProfilePage";
import { HistoryPage } from "@/components/pages/HistoryPage";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [prof, cats] = await Promise.all([
          getOrCreateProfile(),
          getCategories(),
        ]);
        const freshCats = await resetDailyIfNeeded(cats);
        setProfile(prof);
        setCategories(freshCats);
      } catch (e: any) {
        setError(e.message ?? "Erreur de connexion à Supabase");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const navigateTo = (p: Page) => {
    if (p !== "category") setActiveCategory(null);
    setPage(p);
  };

  const handleNavigateToCategory = (cat: Category) => {
    setActiveCategory(cat);
    setPage("category");
  };

  const handleCategoryUpdate = (updated: Category) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)),
    );
    if (activeCategory?.id === updated.id) setActiveCategory(updated);
  };

  const handleProfileUpdate = (updated: UserProfile) => {
    setProfile(updated);
  };

  const handleCategoriesChange = (cats: Category[]) => {
    setCategories(cats);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">
            Connexion à Supabase...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md border border-black p-8 space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
            Erreur de configuration
          </p>
          <p className="text-sm font-mono text-black">{error}</p>
          <p className="text-xs font-mono text-gray-500">
            Vérifie que{" "}
            <code className="bg-gray-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            et{" "}
            <code className="bg-gray-100 px-1">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            sont définis dans{" "}
            <code className="bg-gray-100 px-1">.env.local</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        currentPage={page}
        activeCategoryName={activeCategory?.name}
        onNavigate={navigateTo}
      />
      <main>
        {page === "home" && (
          <HomePage
            categories={categories}
            onNavigateToCategory={handleNavigateToCategory}
            onCategoriesChange={handleCategoriesChange}
          />
        )}
        {page === "category" && activeCategory && profile && (
          <CategoryPage
            category={activeCategory}
            profile={profile}
            onCategoryUpdate={handleCategoryUpdate}
            onProfileUpdate={handleProfileUpdate}
          />
        )}
        {page === "profile" && profile && (
          <ProfilePage profile={profile} categories={categories} />
        )}
        {page === "history" && <HistoryPage categories={categories} />}
      </main>
    </div>
  );
}
