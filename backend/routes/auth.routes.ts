import express from "express";
import { signup, login, refresh, googleAuth, logout } from "../controllers/auth.controller";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.post("/google", googleAuth);

export default router;
