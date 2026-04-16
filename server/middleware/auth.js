import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export async function requireAuth(request, response, next) {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return response.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const [user] = await db.select().from(users).where(eq(users.id, Number(payload.sub))).limit(1);

    if (!user) {
      return response.status(401).json({ error: "User not found" });
    }

    request.user = user;
    next();
  } catch (error) {
    return response.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireOnboarding(request, response, next) {
  if (!request.user?.onboarding_complete) {
    return response.status(403).json({ error: "Onboarding required before accessing coach routes", onboarding_required: true });
  }

  next();
}
