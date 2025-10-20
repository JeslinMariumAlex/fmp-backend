// models/plugin.model.js
import mongoose from "mongoose";

const pluginSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Plugin title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Plugin description is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    subcategory: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    likes: {
      type: Number,
      default: 0,
    },
    hearts: {
      type: Number,
      default: 0,
    },
    oks: {
      type: Number,
      default: 0,
    },
    screenshots: {
      type: [String], // URLs or Base64 strings
      default: [],
    },
    video: {
      type: String, // YouTube link (optional)
    },
    appLink: {
      type: String, // Plugin or app external link
    },
    descText: {
      type: String, // Full HTML description
    },
  },
  {
    timestamps: true, // auto adds createdAt & updatedAt
  }
);

// Create the model
const Plugin = mongoose.model("Plugin", pluginSchema);

export default Plugin;
