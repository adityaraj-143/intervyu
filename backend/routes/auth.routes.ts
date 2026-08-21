import express from "express";
import { signup, login, refresh, googleAuth, logout, me } from "../controllers/auth.controller";
import { authenticateJWT } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.post("/google", googleAuth);
router.get("/me", authenticateJWT, me);

export default router;
