export const validate =
  (schema) =>
  (req, res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      req.body = parsed.body ?? req.body;
      req.query = parsed.query ?? req.query;
      req.params = parsed.params ?? req.params;
      return next();
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err?.issues || err
      });
    }
  };
