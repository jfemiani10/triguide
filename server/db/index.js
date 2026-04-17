import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import * as schema from "./schema.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, "..");
const configuredUrl = process.env.DATABASE_URL || "./data/triguide.db";
const databasePath = path.isAbsolute(configuredUrl) ? configuredUrl : path.resolve(serverRoot, configuredUrl);

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const sqlite = new Database(databasePath);
sqlite.pragma("foreign_keys = ON");

function ensureColumn(tableName, columnName, definition) {
  const columns = sqlite.prepare(`PRAGMA table_info(${tableName})`).all();
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    sqlite.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_terms_at TEXT,
    accepted_privacy_at TEXT,
    age_confirmed_at TEXT,
    terms_version TEXT NOT NULL DEFAULT '2026-04-17',
    privacy_version TEXT NOT NULL DEFAULT '2026-04-16',
    onboarding_complete INTEGER NOT NULL DEFAULT 0,
    strava_connected INTEGER NOT NULL DEFAULT 0,
    demo_messages_remaining INTEGER NOT NULL DEFAULT 3
  );

  CREATE TABLE IF NOT EXISTS athlete_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    goal TEXT NOT NULL,
    target_race TEXT NOT NULL,
    race_distance TEXT NOT NULL,
    experience_level TEXT NOT NULL,
    weakest_discipline TEXT NOT NULL,
    weekly_hours INTEGER NOT NULL,
    injuries_limiters TEXT,
    health_data_consent_at TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS usage_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS coaching_context_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    source TEXT NOT NULL CHECK(source IN ('manual', 'strava_prefill')),
    strava_activity_id TEXT,
    sport TEXT,
    session_date TEXT,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    distance_meters INTEGER,
    moving_time_seconds INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS strava_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    athlete_id TEXT,
    athlete_username TEXT,
    athlete_firstname TEXT,
    athlete_lastname TEXT,
    profile_medium TEXT,
    profile TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    scope TEXT,
    connected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    strava_id TEXT,
    sport_type TEXT,
    start_date TEXT,
    distance_meters INTEGER,
    moving_time_seconds INTEGER,
    avg_heart_rate INTEGER,
    elevation_gain INTEGER,
    suffer_score INTEGER,
    synced_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS activities_user_strava_id_idx ON activities(user_id, strava_id);
`);

ensureColumn("users", "accepted_terms_at", "TEXT");
ensureColumn("users", "accepted_privacy_at", "TEXT");
ensureColumn("users", "age_confirmed_at", "TEXT");
ensureColumn("users", "terms_version", "TEXT NOT NULL DEFAULT '2026-04-17'");
ensureColumn("users", "privacy_version", "TEXT NOT NULL DEFAULT '2026-04-16'");
ensureColumn("athlete_profiles", "health_data_consent_at", "TEXT");
ensureColumn("coaching_context_entries", "strava_activity_id", "TEXT");

sqlite.exec(`
  UPDATE users
  SET demo_messages_remaining = 3
  WHERE demo_messages_remaining > 3
`);

export const db = drizzle(sqlite, { schema });
export { sqlite };
