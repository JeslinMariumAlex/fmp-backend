export class ApiResponse {
  static ok(res, data, meta = {}) {
    return res.json({ success: true, data, meta });
  }
  static created(res, data) {
    return res.status(201).json({ success: true, data });
  }
}
