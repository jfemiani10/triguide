import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  onboarding_complete: integer("onboarding_complete", { mode: "boolean" }).default(false).notNull(),
  strava_connected: integer("strava_connected", { mode: "boolean" }).default(false).notNull(),
  demo_messages_remaining: integer("demo_messages_remaining").default(20).notNull(),
});

export const athleteProfiles = sqliteTable("athlete_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  goal: text("goal").notNull(),
  target_race: text("target_race").notNull(),
  race_distance: text("race_distance").notNull(),
  experience_level: text("experience_level").notNull(),
  weakest_discipline: text("weakest_discipline").notNull(),
  weekly_hours: integer("weekly_hours").notNull(),
  injuries_limiters: text("injuries_limiters"),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const usageLog = sqliteTable("usage_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  input_tokens: integer("input_tokens").notNull(),
  output_tokens: integer("output_tokens").notNull(),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const stravaConnections = sqliteTable("strava_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  athlete_id: text("athlete_id"),
  athlete_username: text("athlete_username"),
  athlete_firstname: text("athlete_firstname"),
  athlete_lastname: text("athlete_lastname"),
  profile_medium: text("profile_medium"),
  profile: text("profile"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  access_token: text("access_token").notNull(),
  refresh_token: text("refresh_token").notNull(),
  expires_at: text("expires_at").notNull(),
  scope: text("scope"),
  connected_at: text("connected_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  strava_id: text("strava_id"),
  sport_type: text("sport_type"),
  start_date: text("start_date"),
  distance_meters: integer("distance_meters"),
  moving_time_seconds: integer("moving_time_seconds"),
  avg_heart_rate: integer("avg_heart_rate"),
  elevation_gain: integer("elevation_gain"),
  suffer_score: integer("suffer_score"),
  synced_at: text("synced_at"),
});
