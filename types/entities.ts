import { STATUSES } from "@/constants/notion";

export type Difficulty = "easy" | "normal" | "hard";
export type TaskType = "recurring" | "goal";
export type TaskSource = "manual" | "notion" | "github" | "strava" | "fitbit";
export type Page = "home" | "category" | "profile" | "history";
export type Status = (typeof STATUSES)[number];
export type CategoryType = "sport" | "dev" | "social" | "freelance" | null;

export interface UserProfile {
  id: string;
  xp_total: number;
  level: number;
  created_at: string;
}

export interface Category {
  last_reset_date: string;
  id: string;
  user_id: string;
  name: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
  category_type: CategoryType;
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
  source: TaskSource;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface TaskSource_Entry {
  id: string;
  task_id: string;
  source: TaskSource;
  external_id: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface TaskCompletion {
  id: string;
  category_id: string;
  task_id: string;
  completed_at: string;
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

export interface NotionRow {
  id: string;
  title: string;
  type: string;
  effort: string;
  status: Status;
  note: string;
  url: string;
}
