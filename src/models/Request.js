import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  text: { type: String, required: true },
  fileUrl: { type: String },      // saved URL (local / S3)
  filename: { type: String },     // original filename
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  status: { type: String, enum: ["new", "reviewed", "closed"], default: "new" },
  createdAt: { type: Date, default: Date.now },
});

const Request = mongoose.models.Request || mongoose.model("Request", requestSchema);
export default Request;
