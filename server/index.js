import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import coachRoutes from "./routes/coach.js";
import stravaRoutes from "./routes/strava.js";
import "./db/index.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const isDevelopment = process.env.NODE_ENV !== "production";

app.use(
  cors({
    origin(origin, callback) {
      if (isDevelopment) {
        return callback(null, true);
      }

      if (!origin || origin === clientOrigin) {
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
app.use("/", profileRoutes);
app.use("/coach", coachRoutes);
app.use("/strava", stravaRoutes);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`TriGuide API listening on port ${port}`);
});
