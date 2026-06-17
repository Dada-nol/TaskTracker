"use client";
import { Page } from "@/types";

interface NavbarProps {
  currentPage: Page;
  activeCategoryName?: string;
  onNavigate: (page: Page) => void;
}

export function Navbar({
  currentPage,
  activeCategoryName,
  onNavigate,
}: NavbarProps) {
  return (
    <header className="border-b border-black bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => onNavigate("home")}
          className="text-sm font-mono font-bold tracking-widest uppercase hover:opacity-60"
        >
          LEVEL UP
        </button>

        <div className="flex items-center gap-1">
          {currentPage === "category" && activeCategoryName && (
            <>
              <span className="text-xs font-mono text-gray-300 px-2">/</span>
              <span className="text-xs font-mono text-gray-500 truncate max-w-32">
                {activeCategoryName}
              </span>
              <span className="text-xs font-mono text-gray-300 px-2">/</span>
            </>
          )}
          <button
            onClick={() => onNavigate("home")}
            className={`px-3 py-1 text-xs font-mono uppercase tracking-wider ${
              currentPage === "home"
                ? "bg-black text-white"
                : "text-gray-500 hover:text-black"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate("profile")}
            className={`px-3 py-1 text-xs font-mono uppercase tracking-wider ${
              currentPage === "profile"
                ? "bg-black text-white"
                : "text-gray-500 hover:text-black"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => onNavigate("history")}
            className={`px-3 py-1 text-xs font-mono uppercase tracking-wider ${
              currentPage === "history"
                ? "bg-black text-white"
                : "text-gray-500 hover:text-black"
            }`}
          >
            Dashboard
          </button>
        </div>
      </div>
    </header>
  );
}
