import {
  XP_BASE,
  HARDCODED_USER_ID,
  DIFFICULTY_POINTS,
  XP_PER_POINT,
} from "@/constants";
import { getSupabase } from "./supabase";
import {
  Category,
  Task,
  UserProfile,
  Difficulty,
  TaskType,
  DailySnapshot,
  TaskCompletion,
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

// ─── Complete / Uncomplete ────────────────────────────────────────────────────

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
    const nextStatusMap: Record<string, string> = {
      Idée: "Script",
      Script: "Tournée",
      Tournée: "Montée",
      Montée: "Postée",
      Postée: "Postée",
    };
    const pageRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/notion?pageId=${task.notion_page_id}`,
    );
    const pageData = await pageRes.json();
    const currentStatus = pageData.properties?.Status?.status?.name ?? "Idée";
    const nextStatus = nextStatusMap[currentStatus] ?? "Script";

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notion`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: task.notion_page_id, status: nextStatus }),
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

  const currentMonth = today.slice(0, 7);
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

  const { count: completedCount } = await db()
    .from("tasks")
    .select("id", { count: "exact" })
    .eq("category_id", category.id)
    .eq("completed", true);

  await db()
    .from("daily_snapshots")
    .upsert(
      {
        category_id: category.id,
        date: today,
        points_used: pointsUsed,
        points_limit: category.daily_point_limit,
        tasks_completed: Number(completedCount ?? 0) + 1,
        xp_gained: xpGain,
      },
      { onConflict: "category_id,date" },
    );

  await db().from("task_completions").insert({
    category_id: category.id,
    task_id: task.id,
    title: task.title,
    difficulty: task.difficulty,
    point_cost: task.point_cost,
    type: task.type,
  });

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

// ─── Notion ───────────────────────────────────────────────────────────────────

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
    .order("created_at", { ascending: false })
    .limit(1);

  return data?.[0] ?? null;
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

// ─── Reset journalier ─────────────────────────────────────────────────────────

export async function resetDailyIfNeeded(
  categories: Category[],
): Promise<Category[]> {
  const today = todayStr();
  const toReset = categories.filter((c) => c.last_reset_date !== today);
  if (toReset.length === 0) return categories;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  await db()
    .from("daily_snapshots")
    .upsert(
      toReset.map((c) => ({
        category_id: c.id,
        date: yesterdayStr,
        points_used: c.points_used_today,
        points_limit: c.daily_point_limit,
        tasks_completed: 0,
        xp_gained: 0,
      })),
      { onConflict: "category_id,date" },
    );

  const { data, error } = await db()
    .from("categories")
    .update({ points_used_today: 0, last_reset_date: today })
    .in(
      "id",
      toReset.map((c) => c.id),
    )
    .select();
  if (error) throw error;

  return categories.map((c) => {
    const reset = (data ?? []).find((d: any) => d.id === c.id);
    return reset ?? c;
  });
}

export async function resetDailyTasks(categoryId: string): Promise<void> {
  const today = todayStr();
  const todayStart = `${today}T00:00:00.000Z`;

  await db()
    .from("tasks")
    .update({ completed: false, completed_at: null })
    .eq("category_id", categoryId)
    .eq("type", "recurring")
    .eq("completed", true)
    .lt("completed_at", todayStart);

  await db()
    .from("tasks")
    .delete()
    .eq("category_id", categoryId)
    .eq("type", "notion_daily")
    .lt("created_at", todayStart);
}

// ─── Snapshots ────────────────────────────────────────────────────────────────

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

// ─── Task completions ─────────────────────────────────────────────────────────

export async function getCompletionsByPeriod(
  days: number = 30,
): Promise<TaskCompletion[]> {
  const from = new Date();
  from.setDate(from.getDate() - days);
  const fromStr = from.toISOString();

  const { data, error } = await db()
    .from("task_completions")
    .select("*")
    .gte("completed_at", fromStr)
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
