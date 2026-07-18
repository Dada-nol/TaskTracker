"use client";
import { TaskItemProps } from "@/types";
import { DifficultyBadge } from "./DifficultyBadge";

export function TaskItem({
  task,
  disabled,
  onToggle,
  onDelete,
  loading,
}: TaskItemProps) {
  const isDisabled = (disabled && !task.completed) || loading;
  const isOverdue = task.type === "goal" && !task.completed;

  return (
    <div
      className={`flex items-start gap-3 py-3 border-b border-gray-100 last:border-0 group ${isDisabled ? "opacity-40" : ""}`}
    >
      <input
        type="checkbox"
        checked={task.completed}
        disabled={isDisabled}
        onChange={() => onToggle(task)}
        className="mt-0.5 w-4 h-4 border border-gray-400 accent-black cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-mono ${task.completed ? "line-through text-gray-400" : "text-black"}`}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wider border border-gray-100 px-1.5 py-0.5">
            {task.type === "recurring" ? "Récurrent" : "Ponctuel"}
          </span>
          <DifficultyBadge difficulty={task.difficulty} />
          <span className="text-xs font-mono text-gray-400">
            {task.point_cost}pt
          </span>
        </div>
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-black text-xs font-mono flex-shrink-0 mt-0.5"
        title="Supprimer"
      >
        ×
      </button>
    </div>
  );
}
