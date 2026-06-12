import { Difficulty } from "@/types";

const LABELS: Record<Difficulty, string> = { easy: "Easy", normal: "Normal", hard: "Hard" };

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className="text-xs font-mono uppercase tracking-wider text-gray-400 border border-gray-200 px-1.5 py-0.5">
      {LABELS[difficulty]}
    </span>
  );
}
