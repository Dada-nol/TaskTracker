"use client";
import { useState } from "react";
import { Difficulty, TaskType } from "@/types";
import { DIFFICULTY_POINTS } from "@/constants";

interface AddTaskFormProps {
  onAdd: (
    title: string,
    difficulty: Difficulty,
    type: TaskType,
  ) => Promise<void>;
  creating: boolean;
}

export function AddTaskForm({ onAdd, creating }: AddTaskFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDifficulty, setTaskDifficulty] = useState<Difficulty>("easy");
  const [taskType, setTaskType] = useState<TaskType>("recurring");

  const handleCreate = async () => {
    if (!taskTitle.trim()) return;
    await onAdd(taskTitle.trim(), taskDifficulty, taskType);
    setTaskTitle("");
    setTaskDifficulty("easy");
    setTaskType("recurring");
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-mono uppercase tracking-wider border border-black px-4 py-2 hover:bg-black hover:text-white"
        >
          + Nouveau défi
        </button>
      </div>

      {showForm && (
        <div className="border border-black p-5 mb-6 space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-500">
            Nouveau défi
          </p>
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Titre du défi..."
            className="w-full border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:border-black placeholder:text-gray-300"
            autoFocus
          />
          <div className="flex gap-4 flex-wrap">
            <div>
              <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                Type
              </p>
              <div className="flex gap-2">
                {(["recurring", "ponctual"] as TaskType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTaskType(t)}
                    className={`px-3 py-1.5 text-xs font-mono border ${taskType === t ? "bg-black text-white border-black" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
                  >
                    {t === "recurring" ? "Récurrent" : "Ponctuel"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                Difficulté
              </p>
              <div className="flex gap-2">
                {(["easy", "normal", "hard"] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setTaskDifficulty(d)}
                    className={`px-3 py-1.5 text-xs font-mono border ${taskDifficulty === d ? "bg-black text-white border-black" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
                  >
                    {d} · {DIFFICULTY_POINTS[d]}pt
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!taskTitle.trim() || creating}
              className="flex-1 py-2 text-sm font-mono bg-black text-white disabled:opacity-30 hover:bg-gray-800"
            >
              {creating ? "Création..." : "Créer"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setTaskTitle("");
              }}
              className="px-4 py-2 text-sm font-mono border border-gray-200 text-gray-500 hover:border-gray-400"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
