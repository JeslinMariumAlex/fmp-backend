// src/routes/contact.routes.js
import { Router } from "express";
import ContactMessage from "../models/contactMessage.model.js";

const router = Router();

// POST /api/contact  → save a new contact message
router.post("/", async (req, res) => {
  try {
    const { email, message } = req.body;

    if (!email || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Email and message are required" });
    }

    const doc = await ContactMessage.create({ email, message });

    return res.json({
      success: true,
      message: "Message received",
      data: {
        id: doc._id,
        createdAt: doc.createdAt,
      },
    });
  } catch (err) {
    console.error("Error in POST /api/contact:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error, please try again" });
  }
});

// GET /api/contact  → list all messages (for admin.html)
router.get("/", async (_req, res) => {
  try {
    const items = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error("Error in GET /api/contact:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load messages" });
  }
});

// DELETE /api/contact/:id  → delete one message
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await ContactMessage.findByIdAndDelete(id);
    return res.json({ success: true, message: "Contact message deleted" });
  } catch (err) {
    console.error("Error in DELETE /api/contact/:id", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete message" });
  }
});

export default router;
