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
import { XPBar } from "@/components/XPBar";
import { TaskItem } from "@/components/TaskItem";
import { Spinner } from "@/components/Spinner";
import {
  getTasksByCategory,
  createTask,
  deleteTask,
  completeTask,
  uncompleteTask,
  getTodayNotionTask,
  resetDailyTasks,
} from "@/lib/db";
import { NotionPanel } from "@/components/connections/NotionPanel";
import { DIFFICULTY_POINTS } from "@/constants";
import { IntegrationBlock } from "../connections/IntegrationBlock";
import { GitHubPanel } from "@/components/connections/GitHubPanel";

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
  const [showForm, setShowForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDifficulty, setTaskDifficulty] = useState<Difficulty>("easy");
  const [taskType, setTaskType] = useState<TaskType>("recurring");
  const [taskDeadline, setTaskDeadline] = useState("");
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

  const handleCreate = async () => {
    if (!taskTitle.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const task = await createTask(
        category.id,
        taskTitle.trim(),
        taskDifficulty,
        taskType,
        taskType === "goal" && taskDeadline ? taskDeadline : null,
      );
      setTasks((prev) => [...prev, task]);
      setTaskTitle("");
      setTaskDifficulty("easy");
      setTaskType("recurring");
      setTaskDeadline("");
      setShowForm(false);
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
  const recurring = tasks.filter((t) => t.type === "recurring");
  const goals = tasks.filter((t) => t.type === "goal");
  const notionTasks = tasks.filter((t) => t.source === "notion");
  const completedCount = tasks.filter((t) => t.completed).length;

  const integrationSuggestion = category.category_type ? (
    <IntegrationBlock
      categoryType={category.category_type}
      hasNotion={!!todayNotionChallenge || category.category_type === "social"}
    />
  ) : null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="border border-black p-6 mb-6">
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="text-xs font-mono uppercase tracking-widest font-bold">
            {category.name}
          </h1>
          <span className="text-xs font-mono text-gray-400">
            LVL {category.level}
          </span>
        </div>
        <XPBar
          currentXP={category.xp}
          xpToNextLevel={category.xp_to_next_level}
          size="md"
        />
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              Utilisés
            </p>
            <p className="text-lg font-mono font-bold">
              {category.points_used_today}
              <span className="text-gray-300 font-normal text-sm">
                {" "}
                / {category.daily_point_limit}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              Restants
            </p>
            <p
              className={`text-lg font-mono font-bold ${remaining === 0 ? "text-gray-400" : "text-black"}`}
            >
              {remaining}pt
            </p>
          </div>
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              Complétés
            </p>
            <p className="text-lg font-mono font-bold">
              {completedCount}
              <span className="text-gray-300 font-normal text-sm">
                {" "}
                / {tasks.length}
              </span>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="border border-black px-4 py-3 mb-4">
          <p className="text-xs font-mono">{error}</p>
        </div>
      )}

      {/* Add task button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-mono uppercase tracking-wider border border-black px-4 py-2 hover:bg-black hover:text-white"
        >
          + Nouveau défi
        </button>
      </div>

      {/* Add task form */}
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
                {(["recurring", "goal"] as TaskType[]).map((t) => (
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
          {taskType === "goal" && (
            <div>
              <input
                type="date"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                className="border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:border-black"
              />
            </div>
          )}
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

      {loadingTasks ? (
        <Spinner />
      ) : (
        <div className="space-y-6">
          {/* Défis récurrents */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
                Défis récurrents
              </p>
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs font-mono text-gray-300">
                {recurring.filter((t) => t.completed).length}/{recurring.length}
              </span>
            </div>
            {recurring.length === 0 ? (
              <p className="text-sm font-mono text-gray-300 py-4">
                Aucun défi récurrent.
              </p>
            ) : (
              <div className="border border-gray-100 px-4">
                {recurring.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    disabled={task.point_cost > remaining}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    loading={toggling === task.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Objectifs ponctuels */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
                Objectifs ponctuels
              </p>
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs font-mono text-gray-300">
                {goals.filter((t) => t.completed).length}/{goals.length}
              </span>
            </div>
            {goals.length === 0 ? (
              <p className="text-sm font-mono text-gray-300 py-4">
                Aucun objectif ponctuel.
              </p>
            ) : (
              <div className="border border-gray-100 px-4">
                {goals.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    disabled={task.point_cost > remaining}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    loading={toggling === task.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Défi Notion du jour */}
          {notionTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
                  Défi Notion du jour
                </p>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs font-mono text-gray-300">
                  {notionTasks.filter((t) => t.completed).length}/
                  {notionTasks.length}
                </span>
              </div>
              <div className="border border-gray-100 px-4">
                {notionTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    disabled={task.point_cost > remaining}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    loading={toggling === task.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notion panel — uniquement pour Social Media */}
      {category.name.toLowerCase().includes("social") && (
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

      {category.category_type && (
        <IntegrationBlock
          categoryType={category.category_type}
          hasNotion={category.category_type === "social"}
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
    </div>
  );
}
