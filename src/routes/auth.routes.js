// src/routes/auth.routes.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
};

/* -----------------------------------
   ADMIN LOGIN (new endpoint)
   POST /api/auth/admin-login
   body: { email, password }
   - supports ENV admin shortcut AND DB admin users (role: "admin")
----------------------------------- */
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Missing credentials" });
    }

    // 1) ENV admin shortcut
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ role: "admin", email }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, COOKIE_OPTIONS);
      return res.json({ ok: true, role: "admin", user: { name: "Admin", email, role: "admin" } });
    }

    // 2) DB admin login (user with role === 'admin')
    const adminUser = await User.findOne({ email, role: "admin" }).exec();
    if (!adminUser) {
      // Do not leak whether email exists
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    if (!adminUser.password) {
      console.warn("Admin user has no password hash in DB:", email);
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, adminUser.password);
    if (!match) {
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: adminUser._id.toString(), role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, COOKIE_OPTIONS);

    return res.json({
      ok: true,
      role: "admin",
      user: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role || "admin",
      },
    });
  } catch (err) {
    console.error("admin-login error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
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
      return res.status(400).json({ ok: false, message: "Missing fields" });
    }

    const exists = await User.findOne({ email }).exec();
    if (exists) {
      return res
        .status(400)
        .json({ ok: false, message: "Email already in use" });
    }

    const hash = await bcrypt.hash(password, 10);

    // role will default to "user" in model/schema
    const user = await User.create({ name, email, password: hash });

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role || "user" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("token", token, COOKIE_OPTIONS);

    return res.json({
      ok: true,
      role: user.role || "user",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
      },
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

    const role = user.role || "user";

    const token = jwt.sign({ id: user._id.toString(), role }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, COOKIE_OPTIONS);

    return res.json({
      ok: true,
      role,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role,
      },
    });
  } catch (err) {
    console.error("user-login error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

/* -----------------------------------
   GET /api/auth/me
   unchanged: reads cookie token and returns user/admin info
----------------------------------- */
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ ok: false, message: "Not authenticated" });
    }

    const payload = jwt.verify(token, JWT_SECRET);

    // ENV ADMIN (token issued via ENV admin-login)
    if (payload.role === "admin" && payload.email && !payload.id) {
      return res.json({
        ok: true,
        role: "admin",
        user: {
          name: "Admin",
          email: payload.email,
          role: "admin",
        },
      });
    }

    // DB USER / DB ADMIN (token issued with id)
    if (payload.id) {
      const user = await User.findById(payload.id)
        .select("_id name email role")
        .lean()
        .exec();

      if (!user) {
        return res
          .status(401)
          .json({ ok: false, message: "Not authenticated" });
      }

      const role = user.role || payload.role || "user";

      return res.json({
        ok: true,
        role,
        user: {
          ...user,
          role,
        },
      });
    }

    return res.status(401).json({ ok: false, message: "Not authenticated" });
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


/* -----------------------------------
   GOOGLE LOGIN
   POST /api/auth/google
   body: { token }
----------------------------------- */
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google", async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ ok: false, message: "No Google token" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ email }).exec();

    if (!user) {
      user = await User.create({
        name,
        email,
        provider: "google",
        role: "user",
      });
    }

    const jwtToken = jwt.sign(
      { id: user._id.toString(), role: user.role || "user" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", jwtToken, COOKIE_OPTIONS);

    return res.json({
      ok: true,
      role: user.role || "user",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
      },
    });
  } catch (err) {
    console.error("Google login error:", err.message);
    return res.status(401).json({ ok: false, message: "Google auth failed" });
  }
});


export default router;
