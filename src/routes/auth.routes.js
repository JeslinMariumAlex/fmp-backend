// src/routes/auth.routes.js
import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

// POST /auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

 res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
});


  res.json({ ok: true, role: "admin" });
});

// GET /auth/me
router.get("/me", (req, res) => {
  try {
    const token = req.cookies?.token;
    const u = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ email: u.email, role: u.role });
  } catch {
    res.status(401).json({ message: "Not authenticated" });
  }
});

// POST /auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
});

  res.json({ ok: true });
});

export default router;
