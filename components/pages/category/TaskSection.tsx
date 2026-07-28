import { Task } from "@/types";
import { TaskItem } from "@/components/TaskItem";

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  remaining: number;
  toggling: string | null;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  emptyMessage?: string;
}

export function TaskSection({
  title,
  tasks,
  remaining,
  toggling,
  onToggle,
  onDelete,
  emptyMessage,
}: TaskSectionProps) {
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
          {title}
        </p>
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs font-mono text-gray-300">
          {completedCount}/{tasks.length}
        </span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm font-mono text-gray-300 py-4">
          {emptyMessage ?? `Aucun élément.`}
        </p>
      ) : (
        <div className="border border-gray-100 px-4">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              disabled={task.point_cost > remaining}
              onToggle={onToggle}
              onDelete={onDelete}
              loading={toggling === task.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
