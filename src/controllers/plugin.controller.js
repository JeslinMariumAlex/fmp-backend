import Plugin from "../models/plugin.model.js";

// CREATE a new plugin
export const createPlugin = async (req, res) => {
  try {
    const plugin = await Plugin.create(req.body);
    res.status(201).json({ success: true, data: plugin });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET all plugins (with optional filters)
export const getPlugins = async (req, res) => {
  try {
    const { category, tag } = req.query;
    let filter = {};

    if (category) filter.category = category;
    if (tag) filter.tags = { $in: [tag] };

    const plugins = await Plugin.find(filter);
    res.json({ success: true, data: plugins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET one plugin by ID
export const getPluginById = async (req, res) => {
  try {
    const plugin = await Plugin.findById(req.params.id);
    if (!plugin) {
      return res.status(404).json({ success: false, message: "Plugin not found" });
    }
    res.json({ success: true, data: plugin });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// UPDATE plugin by ID
export const updatePlugin = async (req, res) => {
  try {
    const plugin = await Plugin.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plugin) {
      return res.status(404).json({ success: false, message: "Plugin not found" });
    }
    res.json({ success: true, data: plugin });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE plugin by ID
export const deletePlugin = async (req, res) => {
  try {
    const plugin = await Plugin.findByIdAndDelete(req.params.id);
    if (!plugin) {
      return res.status(404).json({ success: false, message: "Plugin not found" });
    }
    res.json({ success: true, message: "Plugin deleted successfully" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};