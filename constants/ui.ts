import { Difficulty } from "@/types/entities";

export const LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  normal: "Normal",
  hard: "Hard",
};

export const BAR_HEIGHT = 120;
export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];
export type ViewMode = "overview" | "breakdown";

export const CAT_COLORS = [
  "#000000",
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
];
