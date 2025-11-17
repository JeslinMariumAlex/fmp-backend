// routes/category.routes.js
import express from "express";
import Category from "../models/category.model.js";

const router = express.Router();

// GET /api/categories  -> list all
router.get("/", async (req, res, next) => {
  try {
    const cats = await Category.find();
    res.json({ ok: true, data: cats });
  } catch (err) {
    next(err);
  }
});

// POST /api/categories  -> create
router.post("/", async (req, res, next) => {
  try {
    const { name, subs = [] } = req.body;
    const cat = await Category.create({ name, subs });
    res.status(201).json({ ok: true, data: cat });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/categories/:id  -> update name/subs
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, subs } = req.body;
    const cat = await Category.findByIdAndUpdate(
      id,
      { ...(name && { name }), ...(subs && { subs }) },
      { new: true }
    );
    res.json({ ok: true, data: cat });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/categories/:id  -> delete
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
