import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Request from "../models/Request.js";

const router = express.Router();

// get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// make sure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// --- ROUTES ---

// POST: Save a new request
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { text, name, email, phone } = req.body;

    if (!text) return res.status(400).json({ message: "Requirement text is required" });

    const newReq = new Request({
      text,
      name,
      email,
      phone,
      fileUrl: req.file ? `/uploads/${req.file.filename}` : "",
      filename: req.file ? req.file.originalname : "",
    });

    await newReq.save();
    res.status(201).json({ message: "Request saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

export default router;
