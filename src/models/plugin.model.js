// src/models/plugin.model.js
import mongoose from "mongoose";

const screenshotSchema = new mongoose.Schema(
  { url: { type: String, required: true } },
  { _id: false }
);

const pluginSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true, index: "text" },
    desc:        { type: String, required: true, trim: true, index: "text" },
    descText:    { type: String, default: "" },
    tags:        { type: [String], index: true, default: [] },
    category:    { type: String, required: true, index: true },
    subcategory: { type: String, default: "", index: true },
    screenshots: { type: [screenshotSchema], default: [] },
    video:       { type: String, default: "" },
    appLink:     { type: String, default: "" },

    // reactions
    likes:  { type: Number, default: 0, min: 0 },
    hearts: { type: Number, default: 0, min: 0 },
    oks:    { type: Number, default: 0, min: 0 },

    // ratings
    rating:       { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0, min: 0 },

    // soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// compound search index
pluginSchema.index({ title: "text", desc: "text", tags: 1, category: 1, subcategory: 1 });

// Hide deleted by default on reads
function notDeleted(next) {
  this.where({ isDeleted: false });
  next();
}
pluginSchema.pre("find", notDeleted);
pluginSchema.pre("findOne", notDeleted);


const Plugin = mongoose.model("Plugin", pluginSchema);
export default Plugin;
