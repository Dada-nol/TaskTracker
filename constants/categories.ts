import { CategoryType } from "@/types";

export interface Integration {
  id: string;
  name: string;
  description: string;
}

export interface SuggestedCategory {
  name: string;
  category_type: CategoryType;
  daily_point_limit: number | null;
  description: string;
  integrations: Integration[];
}

export const SUGGESTED_CATEGORIES: SuggestedCategory[] = [
  {
    name: "Développement",
    category_type: "dev",
    daily_point_limit: 8,
    description: "Suivi de ton activité de code au quotidien.",
    integrations: [
      {
        id: "github",
        name: "GitHub",
        description:
          "Importe tes commits pour savoir automatiquement quels jours tu as codé.",
      },
    ],
  },
  {
    name: "Réseaux Sociaux",
    category_type: "social",
    daily_point_limit: 5,
    description: "Suivi de ta production de contenu.",
    integrations: [
      {
        id: "notion",
        name: "Notion",
        description:
          "Pioche dans tes idées Notion et fais avancer leur statut.",
      },
    ],
  },
  {
    name: "Sport",
    category_type: "sport",
    daily_point_limit: null,
    description: "Suivi de tes séances sportives.",
    integrations: [
      {
        id: "strava",
        name: "Strava",
        description: "Importe tes activités Strava automatiquement.",
      },
      {
        id: "fitbit",
        name: "Fitbit",
        description: "Synchronise tes données Fitbit.",
      },
    ],
  },
  {
    name: "Freelance",
    category_type: "freelance",
    daily_point_limit: 3,
    description: "Suivi de tes tâches clients et prospection.",
    integrations: [
      {
        id: "linkedin",
        name: "Linkedin",
        description: "Connecte toi avec d'autres personnes",
      },
    ],
  },
];
