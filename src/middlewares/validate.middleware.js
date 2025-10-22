// src/middlewares/validate.middleware.js

export const validate = (schema) => (req, res, next) => {
  try {
    // For GET requests → validate query params
    // For others (POST, PATCH, etc.) → validate body
    const data =
      req.method === "GET"
        ? { query: req.query }
        : { body: req.body };

    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    // If validation passes, move to controller
    next();
  } catch (err) {
    next(err);
  }
};
