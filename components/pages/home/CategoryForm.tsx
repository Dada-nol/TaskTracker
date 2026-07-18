import { CategoryFormProps } from "@/types";

function CategoryForm({
  error,
  name,
  setName,
  handleCreate,
  limit,
  setLimit,
  loading,
  setShowForm,
}: CategoryFormProps) {
  return (
    <div className="border border-black p-5 mb-8 space-y-4">
      <p className="text-xs font-mono uppercase tracking-widest text-gray-500">
        Nouvelle catégorie
      </p>
      {error && (
        <p className="text-xs font-mono text-black border border-black px-3 py-2">
          {error}
        </p>
      )}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreate(name, limit)}
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
                limit === v
                  ? "bg-black text-white border-black"
                  : "border-gray-200 text-gray-500 hover:border-gray-400"
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
          onClick={() => handleCreate(name, limit)}
          disabled={!name.trim() || loading}
          className="flex-1 py-2 text-sm font-mono bg-black text-white disabled:opacity-30 hover:bg-gray-800"
        >
          {loading ? "Création..." : "Créer"}
        </button>
        <button
          onClick={() => {
            setShowForm(false);
            setName("");
          }}
          className="px-4 py-2 text-sm font-mono border border-gray-200 text-gray-500 hover:border-gray-400"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

export default CategoryForm;
