import { getSupabase } from "./supabase";
import {
  Category,
  Task,
  UserProfile,
  Difficulty,
  TaskType,
  DailySnapshot,
  DIFFICULTY_POINTS,
  XP_PER_POINT,
  XP_BASE,
  HARDCODED_USER_ID,
} from "@/types";

function db() {
  return getSupabase();
}

function xpToNextLevel(level: number): number {
  return XP_BASE * level;
}
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── User profile ─────────────────────────────────────────────────────────────

export async function getOrCreateProfile(): Promise<UserProfile> {
  const { data, error } = await db()
    .from("user_profile")
    .select("*")
    .eq("id", HARDCODED_USER_ID)
    .single();

  if (error || !data) {
    const { data: created, error: createError } = await db()
      .from("user_profile")
      .insert({ id: HARDCODED_USER_ID, xp_total: 0, level: 1 })
      .select()
      .single();
    if (createError) throw createError;
    return created;
  }
  return data;
}

export async function updateProfile(
  patch: Partial<UserProfile>,
): Promise<UserProfile> {
  const { data, error } = await db()
    .from("user_profile")
    .update(patch)
    .eq("id", HARDCODED_USER_ID)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await db()
    .from("categories")
    .select("*")
    .eq("user_id", HARDCODED_USER_ID)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createCategory(
  name: string,
  dailyPointLimit: number,
): Promise<Category> {
  const { data, error } = await db()
    .from("categories")
    .insert({
      user_id: HARDCODED_USER_ID,
      name,
      level: 1,
      xp: 0,
      xp_to_next_level: XP_BASE,
      daily_point_limit: dailyPointLimit,
      points_used_today: 0,
      streak: 0,
      last_active_date: null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await db().from("categories").delete().eq("id", id);
  if (error) throw error;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasksByCategory(categoryId: string): Promise<Task[]> {
  const { data, error } = await db()
    .from("tasks")
    .select("*")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createTask(
  categoryId: string,
  title: string,
  difficulty: Difficulty,
  type: TaskType,
  deadline: string | null,
): Promise<Task> {
  const { data, error } = await db()
    .from("tasks")
    .insert({
      category_id: categoryId,
      title,
      difficulty,
      type,
      point_cost: DIFFICULTY_POINTS[difficulty],
      deadline,
      completed: false,
      completed_at: null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await db().from("tasks").delete().eq("id", id);
  if (error) throw error;
}

// ─── Complete a task ──────────────────────────────────────────────────────────

export async function completeTask(
  task: Task,
  category: Category,
  profile: UserProfile,
): Promise<{ updatedCategory: Category; updatedProfile: UserProfile }> {
  const today = todayStr();
  const pointsUsed = category.points_used_today + task.point_cost;

  if (pointsUsed > category.daily_point_limit) {
    throw new Error("Limite journalière atteinte");
  }

  await db()
    .from("tasks")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", task.id);

  if (task.notion_page_id) {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notion`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: task.notion_page_id, status: "Script" }),
    });
  }

  const xpGain = task.point_cost * XP_PER_POINT;
  let newCatXP = category.xp + xpGain;
  let newCatLevel = category.level;
  let threshold = xpToNextLevel(newCatLevel);

  while (newCatXP >= threshold) {
    newCatXP -= threshold;
    newCatLevel++;
    threshold = xpToNextLevel(newCatLevel);
  }

  // Jours actifs ce mois
  const currentMonth = today.slice(0, 7); // "2026-06"
  let newActiveDays = category.active_days_this_month;
  const isSameMonth = category.active_days_month === currentMonth;
  const alreadyActiveToday = category.last_active_date === today;

  if (!isSameMonth) {
    newActiveDays = 1;
  } else if (!alreadyActiveToday) {
    newActiveDays += 1;
  }

  const { data: updatedCategory, error: catError } = await db()
    .from("categories")
    .update({
      xp: newCatXP,
      xp_to_next_level: xpToNextLevel(newCatLevel),
      level: newCatLevel,
      points_used_today: pointsUsed,
      active_days_this_month: newActiveDays,
      active_days_month: currentMonth,
      last_active_date: today,
    })
    .eq("id", category.id)
    .select()
    .single();
  if (catError) throw catError;

  // Snapshot du jour
  const tasksCompletedToday =
    (
      await db()
        .from("tasks")
        .select("id", { count: "exact" })
        .eq("category_id", category.id)
        .eq("completed", true)
    ).count ?? 0;

  await db()
    .from("daily_snapshots")
    .upsert(
      {
        category_id: category.id,
        date: today,
        points_used: pointsUsed,
        points_limit: category.daily_point_limit,
        tasks_completed: Number(tasksCompletedToday) + 1,
        xp_gained: category.xp - category.xp + xpGain,
      },
      { onConflict: "category_id,date" },
    );

  let newProfileXP = profile.xp_total + xpGain;
  let newProfileLevel = profile.level;
  let profileThreshold = xpToNextLevel(newProfileLevel);

  while (newProfileXP >= profileThreshold) {
    newProfileXP -= profileThreshold;
    newProfileLevel++;
    profileThreshold = xpToNextLevel(newProfileLevel);
  }

  const { data: updatedProfile, error: profError } = await db()
    .from("user_profile")
    .update({ xp_total: newProfileXP, level: newProfileLevel })
    .eq("id", HARDCODED_USER_ID)
    .select()
    .single();
  if (profError) throw profError;

  return { updatedCategory, updatedProfile };
}

export async function uncompleteTask(
  task: Task,
  category: Category,
  profile: UserProfile,
): Promise<{ updatedCategory: Category; updatedProfile: UserProfile }> {
  const xpLoss = task.point_cost * XP_PER_POINT;

  await db()
    .from("tasks")
    .update({ completed: false, completed_at: null })
    .eq("id", task.id);

  const { data: updatedCategory, error: catError } = await db()
    .from("categories")
    .update({
      xp: Math.max(0, category.xp - xpLoss),
      points_used_today: Math.max(
        0,
        category.points_used_today - task.point_cost,
      ),
    })
    .eq("id", category.id)
    .select()
    .single();
  if (catError) throw catError;

  const { data: updatedProfile, error: profError } = await db()
    .from("user_profile")
    .update({ xp_total: Math.max(0, profile.xp_total - xpLoss) })
    .eq("id", HARDCODED_USER_ID)
    .select()
    .single();
  if (profError) throw profError;

  return { updatedCategory, updatedProfile };
}

export async function getTodayNotionChallenge(
  categoryId: string,
): Promise<Task | null> {
  const today = todayStr();
  const todayStart = `${today}T00:00:00.000Z`;
  const todayEnd = `${today}T23:59:59.999Z`;

  const { data } = await db()
    .from("tasks")
    .select("*")
    .eq("category_id", categoryId)
    .eq("type", "notion_daily")
    .gte("created_at", todayStart)
    .lte("created_at", todayEnd)
    .maybeSingle();

  return data ?? null;
}

export async function createNotionDailyChallenge(
  categoryId: string,
  notionPageId: string,
  title: string,
  effort: "Faible" | "Moyen" | "Élevé",
): Promise<Task> {
  const difficultyMap: Record<string, Difficulty> = {
    Faible: "easy",
    Moyen: "normal",
    Élevé: "hard",
  };
  const difficulty = difficultyMap[effort] ?? "easy";

  const todayStart = `${todayStr()}T00:00:00.000Z`;

  await db()
    .from("tasks")
    .delete()
    .eq("category_id", categoryId)
    .eq("type", "notion_daily")
    .lt("created_at", todayStart);

  const { data, error } = await db()
    .from("tasks")
    .insert({
      category_id: categoryId,
      title,
      difficulty,
      type: "notion_daily",
      point_cost: DIFFICULTY_POINTS[difficulty],
      deadline: null,
      completed: false,
      completed_at: null,
      notion_page_id: notionPageId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSnapshots(
  days: number = 30,
): Promise<DailySnapshot[]> {
  const from = new Date();
  from.setDate(from.getDate() - days);
  const fromStr = from.toISOString().slice(0, 10);

  const { data, error } = await db()
    .from("daily_snapshots")
    .select("*")
    .gte("date", fromStr)
    .order("date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
