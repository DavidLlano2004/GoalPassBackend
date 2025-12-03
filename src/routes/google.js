import express from "express";
import dotenv from "dotenv";
import { googleCallback } from "../controllers/authController.js";

dotenv.config();

const router = express.Router();

// REDIRIGE A GOOGLE LOGIN
router.get("/", (req, res) => {
  console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
  const redirect =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent("openid email profile")}`;

  return res.redirect(redirect);
});

router.get("/callback", googleCallback);

export default router;
