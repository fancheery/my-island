export type Weather = "晴" | "有雾" | "下雨" | "起风" | "夜" | null;

export interface Entry {
  id: string;
  kind: string; // v0.1 只有 "diary"，为信件/胶囊等预留
  entry_date: string; // YYYY-MM-DD
  body: string;
  weather: Weather;
  image_paths: string[]; // 云端为存储路径，演示模式为 data: URL
  created_at: string;
  updated_at: string;
}

export interface MeResponse {
  ok: boolean;
  mode: "supabase" | "dev";
  user: { id: string; email: string } | null;
}

export const WEATHERS: { key: Exclude<Weather, null>; label: string }[] = [
  { key: "晴", label: "晴" },
  { key: "有雾", label: "有雾" },
  { key: "下雨", label: "下雨" },
  { key: "起风", label: "起风" },
  { key: "夜", label: "夜" },
];

export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function greeting(hour: number): string {
  if (hour >= 23 || hour < 5) return "还醒着。岛上很安静。";
  if (hour < 11) return "早。今天，岛上怎么样？";
  return "今天，岛上怎么样？";
}

export function formatDateLine(d: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(d);
}

export function firstLine(body: string): string {
  const line = body.split("\n").find((l) => l.trim().length > 0);
  return line ? line.trim() : "（没写字）";
}

export function monthLabel(dateStr: string): string {
  const [y, m] = dateStr.split("-");
  return `${y}年${Number(m)}月`;
}
