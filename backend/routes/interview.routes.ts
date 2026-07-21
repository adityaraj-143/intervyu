import express from "express";
import { authenticateJWT } from "../middlewares/auth.middleware";
import {
  handleGenerateReport,
  handleGetReport,
  handleGetTranscript,
  handleServePdf,
} from "../controllers/report.controller";
import { handleListInterviews } from "../controllers/interview.controller";

const router = express.Router();

// List all interviews for the authenticated user
router.get("/", authenticateJWT, handleListInterviews);

// Report generation & retrieval
router.post("/:id/report", authenticateJWT, handleGenerateReport);
router.get("/:id/report", authenticateJWT, handleGetReport);

// Transcript retrieval
router.get("/:id/transcript", authenticateJWT, handleGetTranscript);

// PDF serving
router.get("/:id/pdf/:type", authenticateJWT, handleServePdf);

export default router;
