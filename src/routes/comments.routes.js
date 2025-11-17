// src/routes/comments.routes.js
import express from "express";
import sanitizeHtml from "sanitize-html";
import Comment from "../models/comment.model.js";
import User from "../models/User.js";
import { authRequired } from "../middlewares/auth.middleware.js"; // your middleware

const router = express.Router();

// GET comments for plugin
router.get("/plugins/:id/comments", async (req, res) => {
  try {
    const pluginId = req.params.id;
    const comments = await Comment.find({ pluginId })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate({ path: "userId", select: "name" })
      .lean()
      .exec();
    const out = comments.map((c) => ({
      id: c._id,
      content: c.content,
      createdAt: c.createdAt,
      user_id: c.userId?._id || null,
      user_name: c.userId?._id ? c.userId.name : "Unknown",
    }));
    res.json({ ok: true, items: out });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

// POST comment (auth required)
router.post("/plugins/:id/comments", authRequired, async (req, res) => {
  try {
    const pluginId = req.params.id;
    const raw = String(req.body.content || "").trim();
    if (!raw)
      return res.status(400).json({ ok: false, message: "Empty comment" });

    const clean = sanitizeHtml(raw, { allowedTags: [], allowedAttributes: {} });

    const comment = await Comment.create({
      pluginId,
      userId: req.user.id,
      content: clean,
    });
    await comment.populate({ path: "userId", select: "name" });

    res.status(201).json({
      ok: true,
      item: {
        id: comment._id,
        content: comment.content,
        createdAt: comment.createdAt,
        user_id: comment.userId._id,
        user_name: comment.userId.name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

// DELETE comment (owner or admin)
router.delete("/comments/:id", authRequired, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id).exec();
    if (!comment)
      return res.status(404).json({ ok: false, message: "Not found" });

    const isOwner = comment.userId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin" || req.user.isAdmin;
    if (!isOwner && !isAdmin)
      return res.status(403).json({ ok: false, message: "Forbidden" });

    await Comment.deleteOne({ _id: comment._id }).exec();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

// GET all comments (admin only)
router.get("/comments", authRequired, async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin" || req.user.isAdmin;
    if (!isAdmin) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const comments = await Comment.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .populate({ path: "userId", select: "name email" })
      .lean()
      .exec();

    const items = comments.map((c) => ({
      id: c._id,
      pluginId: c.pluginId,
      content: c.content,
      createdAt: c.createdAt,
      user_name: c.userId?.name || "Unknown",
      user_email: c.userId?.email || "",
    }));

    return res.json({ ok: true, items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

export default router;
