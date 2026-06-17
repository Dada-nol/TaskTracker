import { Difficulty } from "@/types/entities";

export const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  easy: 1,
  normal: 2,
  hard: 3,
};

export const XP_PER_POINT = 10;
export const XP_BASE = 500;
export const HARDCODED_USER_ID = "00000000-0000-0000-0000-000000000001";
