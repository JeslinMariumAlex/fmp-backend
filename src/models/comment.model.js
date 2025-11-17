// src/models/comment.model.js
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  pluginId: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

commentSchema.index({ pluginId: 1, createdAt: -1 });

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
