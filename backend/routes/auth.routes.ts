import express from "express";
import { signup, login, refresh, googleAuth } from "../controllers/auth.controller";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/google", googleAuth);

export default router;
