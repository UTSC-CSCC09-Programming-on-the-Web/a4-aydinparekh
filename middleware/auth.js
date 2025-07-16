import { sessionStore } from "../utils/session-store.js";

export const authenticateToken = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required." });
  }
  const token = authHeader.split(" ")[1];
  const session = sessionStore[token];
  if (!session) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
  // Check expiration
  if (session.expires < Date.now()) {
    delete sessionStore[token];
    return res.status(401).json({ error: "Invalid or expired token." });
  }
  req.userId = session.userId;
  next();
};
