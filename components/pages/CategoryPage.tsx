"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Category,
  Task,
  Difficulty,
  TaskType,
  UserProfile,
  CategoryPageProps,
} from "@/types";
import { Spinner } from "@/components/Spinner";
import { NotionPanel } from "@/components/connections/NotionPanel";
import { IntegrationBlock } from "@/components/connections/IntegrationBlock";
import { GitHubPanel } from "@/components/connections/GitHubPanel";
import {
  getTasksByCategory,
  createTask,
  deleteTask,
  completeTask,
  uncompleteTask,
  getTodayNotionTask,
  resetDailyTasks,
} from "@/lib/db";
import { CategoryHeader } from "./category/CategoryHeader";
import { AddTaskForm } from "./category/AddTaskForm";
import { TaskSection } from "./category/TaskSection";

export function CategoryPage({
  category,
  profile,
  onCategoryUpdate,
  onProfileUpdate,
}: CategoryPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayNotionChallenge, setTodayNotionChallenge] = useState<Task | null>(
    null,
  );
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      await resetDailyTasks(category.id);
      const [data, notionChallenge] = await Promise.all([
        getTasksByCategory(category.id),
        getTodayNotionTask(category.id),
      ]);
      setTodayNotionChallenge(notionChallenge);
      const withoutNotion = data.filter((t) => t.source !== "notion");
      setTasks(
        notionChallenge ? [...withoutNotion, notionChallenge] : withoutNotion,
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingTasks(false);
    }
  }, [category.id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleToggle = async (task: Task) => {
    setToggling(task.id);
    setError(null);
    try {
      if (task.completed) {
        const { updatedCategory, updatedProfile } = await uncompleteTask(
          task,
          category,
          profile,
        );
        onCategoryUpdate(updatedCategory);
        onProfileUpdate(updatedProfile);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, completed: false, completed_at: null }
              : t,
          ),
        );
      } else {
        const { updatedCategory, updatedProfile } = await completeTask(
          task,
          category,
          profile,
        );
        onCategoryUpdate(updatedCategory);
        onProfileUpdate(updatedProfile);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  completed: true,
                  completed_at: new Date().toISOString(),
                }
              : t,
          ),
        );
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setToggling(null);
    }
  };

  const handleCreate = async (
    title: string,
    difficulty: Difficulty,
    type: TaskType,
  ) => {
    setCreating(true);
    setError(null);
    try {
      const task = await createTask(category.id, title, difficulty, type);
      setTasks((prev) => [...prev, task]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce défi ?")) return;
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const remaining = category.daily_point_limit - category.points_used_today;
  const recurring = tasks.filter(
    (t) => t.type === "recurring" && t.source === "manual",
  );
  const ponctuals = tasks.filter(
    (t) => t.type === "ponctual" && t.source === "manual",
  );
  const notionTasks = tasks.filter((t) => t.source === "notion");
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <CategoryHeader
        category={category}
        completedCount={completedCount}
        totalCount={tasks.length}
      />

      {error && (
        <div className="border border-black px-4 py-3 mb-4">
          <p className="text-xs font-mono">{error}</p>
        </div>
      )}

      {category.category_type !== "social" &&
        category.category_type !== "dev" && (
          <>
            <AddTaskForm onAdd={handleCreate} creating={creating} />

            {loadingTasks ? (
              <Spinner />
            ) : (
              <div className="space-y-6">
                <TaskSection
                  title="Défis récurrents"
                  tasks={recurring}
                  remaining={remaining}
                  toggling={toggling}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  emptyMessage="Aucun défi récurrent."
                />
                <TaskSection
                  title="Objectifs ponctuels"
                  tasks={ponctuals}
                  remaining={remaining}
                  toggling={toggling}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  emptyMessage="Aucun objectif ponctuel."
                />
                {notionTasks.length > 0 && (
                  <TaskSection
                    title="Défi Notion du jour"
                    tasks={notionTasks}
                    remaining={remaining}
                    toggling={toggling}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                )}
              </div>
            )}
          </>
        )}

      {category.category_type === "social" && (
        <NotionPanel
          category={category}
          profile={profile}
          todayChallenge={todayNotionChallenge}
          onChallengeCreated={(task) => {
            setTodayNotionChallenge(task);
            setTasks((prev) => [
              ...prev.filter((t) => t.source !== "notion"),
              task,
            ]);
          }}
        />
      )}

      {category.category_type === "dev" && (
        <GitHubPanel
          category={category}
          profile={profile}
          onCategoryUpdate={onCategoryUpdate}
          onProfileUpdate={onProfileUpdate}
        />
      )}

      {category.category_type && (
        <IntegrationBlock
          categoryType={category.category_type}
          hasNotion={category.category_type === "social"}
        />
      )}
    </div>
  );
}
