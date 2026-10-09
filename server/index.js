import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import coachRoutes from "./routes/coach.js";
import stravaRoutes from "./routes/strava.js";
import dataRoutes from "./routes/data.js";
import "./db/index.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || "0.0.0.0";
const isDevelopment = process.env.NODE_ENV !== "production";

// CLIENT_ORIGIN accepts a comma-separated list so one self-hosted instance can
// serve the deployed frontend and a local dev client at the same time.
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((value) => value.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (isDevelopment) {
        return callback(null, true);
      }

      if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ""))) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/coach", coachRoutes);
app.use("/strava", stravaRoutes);
app.use("/data", dataRoutes);
app.use("/", profileRoutes);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "Internal server error" });
});

app.listen(port, host, () => {
  console.log(`TriGuide API listening on ${host}:${port}`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
});
