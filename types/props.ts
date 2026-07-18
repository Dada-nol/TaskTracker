import { Task, Category, UserProfile } from "./entities";

export interface TaskItemProps {
  task: Task;
  disabled: boolean;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export interface XPBarProps {
  currentXP: number;
  xpToNextLevel: number;
  size?: "sm" | "md";
}

export interface NotionPanelProps {
  category: Category;
  profile: UserProfile;
  todayChallenge: Task | null;
  onChallengeCreated: (task: Task) => void;
}

export interface ProfilePageProps {
  profile: UserProfile;
  categories: Category[];
}

export interface HomePageProps {
  categories: Category[];
  onNavigateToCategory: (cat: Category) => void;
  onCategoriesChange: (cats: Category[]) => void;
}

export interface HistoryPageProps {
  categories: Category[];
}

export interface CategoryPageProps {
  category: Category;
  profile: UserProfile;
  onCategoryUpdate: (cat: Category) => void;
  onProfileUpdate: (profile: UserProfile) => void;
}

export interface CategoryCardProps {
  category: Category;
  onNavigateToCategory: (cat: Category) => void;
  handleDelete: (
    id: Category["id"],
    e: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  remaining: number;
}

export interface CategoryFormProps {
  error: string | null;
  name: string;
  setName: (value: string) => void;
  handleCreate: (name: string, limit: number) => void;
  limit: number;
  setLimit: (value: number) => void;
  loading: boolean;
  setShowForm: (value: boolean) => void;
}
