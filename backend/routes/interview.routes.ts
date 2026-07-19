import express from "express";
import { authenticateJWT } from "../middlewares/auth.middleware";
import {
  handleGenerateReport,
  handleGetReport,
  handleGetTranscript,
  handleServePdf,
} from "../controllers/report.controller";

const router = express.Router();

// Report generation & retrieval
router.post("/:id/report", authenticateJWT, handleGenerateReport);
router.get("/:id/report", authenticateJWT, handleGetReport);

// Transcript retrieval
router.get("/:id/transcript", authenticateJWT, handleGetTranscript);

// PDF serving
router.get("/:id/pdf/:type", authenticateJWT, handleServePdf);

export default router;
