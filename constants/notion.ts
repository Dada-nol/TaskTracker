import { Status } from "@/types/entities";

export const STATUSES = [
  "Idée",
  "Script",
  "Tournée",
  "Montée",
  "Postée",
] as const;

export const STATUS_COLORS: Record<Status, string> = {
  Idée: "bg-gray-100 text-gray-500",
  Script: "bg-red-50 text-red-500",
  Tournée: "bg-orange-50 text-orange-500",
  Montée: "bg-yellow-50 text-yellow-600",
  Postée: "bg-green-50 text-green-600",
};

export const EFFORT_LABELS: Record<string, string> = {
  Faible: "1pt",
  Moyen: "2pt",
  Élevé: "3pt",
};
