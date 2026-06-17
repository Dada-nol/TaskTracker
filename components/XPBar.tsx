import { XPBarProps } from "@/types";

export function XPBar({ currentXP, xpToNextLevel, size = "sm" }: XPBarProps) {
  const pct = Math.min(100, Math.round((currentXP / xpToNextLevel) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
          XP
        </span>
        <span className="text-xs font-mono text-gray-400">
          {currentXP} / {xpToNextLevel}
        </span>
      </div>
      <div
        className={`w-full bg-gray-100 border border-gray-200 ${size === "md" ? "h-2" : "h-1.5"}`}
      >
        <div
          className="h-full bg-black transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs font-mono text-gray-400">{pct}% to next level</p>
    </div>
  );
}
