export type Difficulty = "easy" | "normal" | "hard";
export type TaskType = "recurring" | "goal" | "notion_daily";
export type Page = "home" | "category" | "profile" | "history";

export interface UserProfile {
  id: string;
  xp_total: number;
  level: number;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
  daily_point_limit: number;
  points_used_today: number;
  active_days_this_month: number;
  active_days_month: string | null;
  last_active_date: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  category_id: string;
  title: string;
  difficulty: Difficulty;
  type: TaskType;
  point_cost: number;
  deadline: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  notion_page_id: string | null;
}

export interface DailySnapshot {
  id: string;
  category_id: string;
  date: string;
  points_used: number;
  points_limit: number;
  tasks_completed: number;
  xp_gained: number;
}

export const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  easy: 1,
  normal: 2,
  hard: 3,
};

export const XP_PER_POINT = 10;
export const XP_BASE = 500;
export const HARDCODED_USER_ID = "00000000-0000-0000-0000-000000000001";
