// src/routes/requests.routes.js
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Request from "../models/Request.js";

const router = express.Router();

// __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// create uploads folder if not exist
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const name = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, name);
  }
});
const upload = multer({ storage });


// ---------------------------
//  CREATE REQUEST (Public)
// ---------------------------
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { text, name, email, phone } = req.body;

    const newReq = await Request.create({
      text,
      name,
      email,
      phone,
      fileUrl: req.file ? `/uploads/${req.file.filename}` : "",
      filename: req.file ? req.file.originalname : "",
    });

    res.status(201).json({ success: true, data: newReq });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving request" });
  }
});


// ---------------------------
//  GET ALL REQUESTS (Admin)
// ---------------------------
router.get("/", async (req, res) => {
  try {
    const list = await Request.find().sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});


// ---------------------------
//  GET SINGLE REQUEST (Admin)
// ---------------------------
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch request" });
  }
});


// ---------------------------
//  DELETE REQUEST (Admin)
// ---------------------------
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Request.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Request not found" });

    res.json({ success: true, message: "Request deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});


export default router;
