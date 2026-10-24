import { promises as fs } from "fs";
import path from "path";
import type { Entry } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface DbShape {
  entries: Entry[];
}

async function readDb(): Promise<DbShape> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as DbShape;
    if (!Array.isArray(parsed.entries)) return { entries: [] };
    return parsed;
  } catch {
    return { entries: [] };
  }
}

async function writeDb(db: DbShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

export async function listEntries(): Promise<Entry[]> {
  const db = await readDb();
  return db.entries.sort((a, b) =>
    a.entry_date === b.entry_date
      ? b.updated_at.localeCompare(a.updated_at)
      : b.entry_date.localeCompare(a.entry_date)
  );
}

export async function getEntry(id: string): Promise<Entry | null> {
  const db = await readDb();
  return db.entries.find((e) => e.id === id) ?? null;
}

export async function upsertEntry(input: Entry): Promise<Entry> {
  const db = await readDb();
  const idx = db.entries.findIndex((e) => e.id === input.id);
  if (idx >= 0) {
    db.entries[idx] = input;
  } else {
    db.entries.push(input);
  }
  await writeDb(db);
  return input;
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await readDb();
  db.entries = db.entries.filter((e) => e.id !== id);
  await writeDb(db);
}
