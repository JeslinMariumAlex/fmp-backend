// src/routes/auth.routes.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/* -----------------------------------
   ADMIN LOGIN
   POST /api/auth/login
----------------------------------- */
router.post("/login", (req, res, next) => {
  const { email, password } = req.body || {};

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ email, role: "admin" }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, COOKIE_OPTIONS);
    return res.json({ ok: true, role: "admin" });
  }

  // not admin → go to user login handler
  return next();
});

/* -----------------------------------
   USER REGISTER
   POST /api/auth/user-register
   body: { name, email, password }
----------------------------------- */
router.post("/user-register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Missing fields" });
    }

    const exists = await User.findOne({ email }).exec();
    if (exists) {
      return res
        .status(400)
        .json({ ok: false, message: "Email already in use" });
    }

    // 👉 hash and store in field `password`
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });

    const token = jwt.sign(
      { id: user._id.toString(), role: "user" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("token", token, COOKIE_OPTIONS);

    return res.json({
      ok: true,
      role: "user",
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("user-register error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

/* -----------------------------------
   USER LOGIN
   POST /api/auth/user-login
   body: { email, password }
----------------------------------- */
router.post("/user-login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Missing credentials" });
    }

    const user = await User.findOne({ email }).exec();
    if (!user) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid credentials" });
    }

    // 👉 use the same field `password` where we stored the hash
    if (!user.password) {
      console.warn("User has no password hash in DB:", email);
      return res
        .status(401)
        .json({ ok: false, message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: "user" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("token", token, COOKIE_OPTIONS);

    return res.json({
      ok: true,
      role: "user",
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("user-login error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

/* -----------------------------------
   GET /api/auth/me
----------------------------------- */
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token)
      return res
        .status(401)
        .json({ ok: false, message: "Not authenticated" });

    const payload = jwt.verify(token, JWT_SECRET);

    if (payload.role === "admin") {
      return res.json({ ok: true, role: "admin", email: payload.email });
    }

    if (payload.role === "user" && payload.id) {
      const user = await User.findById(payload.id)
        .select("_id name email isAdmin")
        .lean()
        .exec();
      if (!user)
        return res
          .status(401)
          .json({ ok: false, message: "Not authenticated" });
      return res.json({ ok: true, role: "user", user });
    }

    return res
      .status(401)
      .json({ ok: false, message: "Not authenticated" });
  } catch (err) {
    console.error("me error:", err);
    return res.status(401).json({ ok: false, message: "Not authenticated" });
  }
});

/* -----------------------------------
   POST /api/auth/logout
----------------------------------- */
router.post("/logout", (_req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.json({ ok: true });
});

export default router;
