import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", (_request, response) => {
  return response.status(501).json({
    error: "Strava Integration Coming Soon",
  });
});

router.all("*", (_request, response) => {
  return response.status(501).json({
    error: "Not Implemented",
  });
});

export default router;
