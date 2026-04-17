import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { users, athleteProfiles } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();
const TERMS_VERSION = "2026-04-17";
const PRIVACY_VERSION = "2026-04-16";

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    onboarding_complete: Boolean(user.onboarding_complete),
    strava_connected: Boolean(user.strava_connected),
    demo_messages_remaining: user.demo_messages_remaining,
    created_at: user.created_at,
  };
}

router.post("/signup", async (request, response) => {
  const { name, email, password, accepted_terms, accepted_privacy, age_confirmed } = request.body || {};

  if (!name || !email || !password || password.length < 8) {
    return response.status(400).json({ error: "Name, email, and password (min 8 chars) are required" });
  }

  if (!accepted_terms || !accepted_privacy) {
    return response.status(400).json({ error: "You must agree to the Terms of Use and Privacy Policy" });
  }

  if (!age_confirmed) {
    return response.status(400).json({ error: "You must confirm that you are 18 or older" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

  if (existing) {
    return response.status(409).json({ error: "An account with that email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const consentedAt = new Date().toISOString();
  const result = await db.insert(users).values({
    name: String(name).trim(),
    email: normalizedEmail,
    password_hash: passwordHash,
    accepted_terms_at: consentedAt,
    accepted_privacy_at: consentedAt,
    age_confirmed_at: consentedAt,
    terms_version: TERMS_VERSION,
    privacy_version: PRIVACY_VERSION,
    demo_messages_remaining: 3,
  }).returning();

  const createdUser = result[0];

  return response.status(201).json({
    token: signToken(createdUser),
    user: serializeUser(createdUser),
    profile: null,
  });
});

router.post("/login", async (request, response) => {
  const { email, password } = request.body || {};

  if (!email || !password) {
    return response.status(400).json({ error: "Email and password are required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

  if (!user) {
    return response.status(401).json({ error: "Invalid email or password" });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    return response.status(401).json({ error: "Invalid email or password" });
  }

  const [profile] = await db.select().from(athleteProfiles).where(eq(athleteProfiles.user_id, user.id)).limit(1);

  return response.json({
    token: signToken(user),
    user: serializeUser(user),
    profile: profile || null,
  });
});

export { serializeUser };
export default router;
