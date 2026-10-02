import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { AppConfig } from "../config/env.js";
import * as schema from "./schema.js";

export interface DatabaseHandle {
  db: BetterSQLite3Database<typeof schema>;
  close: () => void;
}

export function createDatabase(config: Pick<AppConfig, "DATABASE_URL">): DatabaseHandle {
  const databasePath = resolve(config.DATABASE_URL);
  mkdirSync(dirname(databasePath), { recursive: true });

  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  return {
    db: drizzle(sqlite, { schema }),
    close: () => sqlite.close(),
  };
}

export type DatabaseClient = DatabaseHandle["db"];
