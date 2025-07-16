import { User } from "../models/users.js";
import { Image } from "../models/images.js";
import { Router } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { authenticateToken } from "../middleware/auth.js";
import { validateInput } from "../utils/validate-input.js";
import { sessionStore } from "../utils/session-store.js";

export const usersRouter = Router();

const SALT_ROUNDS = 10;

// Set token expiration time - 1 hour
const TOKEN_EXPIRATION = 60 * 60 * 1000;

// Sign up a new user
// POST /users/signup
usersRouter.post("/signup", function (req, res) {
  Promise.resolve().then(function () {
    // Validate Input
    const schema = [
      {
        name: "username",
        required: true,
        type: "string",
        location: "body",
      },
      {
        name: "password",
        required: true,
        type: "string",
        location: "body",
      },
    ];
    if (!validateInput(req, res, schema)) return;

    const { username, password } = req.body;
    // Check if the username already exists
    return User.findOne({ where: { username } }).then((existingUser) => {
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      // Hash the password
      return bcrypt.hash(password, SALT_ROUNDS).then((hashedPassword) => {
        // Create the user
        return User.create({
          username,
          password: hashedPassword,
        })
          .then((user) => {
            const sessionToken = crypto.randomBytes(32).toString("hex");
            // Store session token in memory with expiration
            sessionStore[sessionToken] = {
              userId: user.id,
              expires: Date.now() + TOKEN_EXPIRATION,
            };
            return res.status(201).json({
              token: sessionToken,
              user: {
                id: user.id,
                username: user.username,
              },
            });
          })
          .catch((e) => {
            if (e.name === "SequelizeValidationError") {
              return res.status(422).json({
                error: "Invalid input parameters",
              });
            } else {
              return res.status(400).json({ error: "Cannot create user." });
            }
          });
      });
    });
  });
});

// Login a user
// POST /users/login
usersRouter.post("/login", function (req, res) {
  Promise.resolve().then(function () {
    // Validate Input
    const schema = [
      {
        name: "username",
        required: true,
        type: "string",
        location: "body",
      },
      {
        name: "password",
        required: true,
        type: "string",
        location: "body",
      },
    ];
    if (!validateInput(req, res, schema)) return;

    const { username, password } = req.body;

    // Find the user by username
    return User.findOne({ where: { username } }).then((user) => {
      if (!user) {
        return res.status(401).json({ error: "Username does not exist." });
      }

      // Compare the password
      return bcrypt.compare(password, user.password).then((match) => {
        if (!match) {
          return res.status(401).json({ error: "Invalid password" });
        }

        const sessionToken = crypto.randomBytes(32).toString("hex");
        // Store session token in memory with expiration
        sessionStore[sessionToken] = {
          userId: user.id,
          expires: Date.now() + TOKEN_EXPIRATION, // 1 hour
        };
        return res.status(201).json({
          token: sessionToken,
          user: {
            id: user.id,
            username: user.username,
          },
        });
      });
    });
  });
});

// Logout the user
// POST /users/logout
usersRouter.post("/logout", authenticateToken, function (req, res) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required." });
  }
  const token = authHeader.split(" ")[1];
  if (token && sessionStore[token]) {
    delete sessionStore[token];
  }
  return res.status(200).json({ message: "Logged out successfully." });
});

// Get the current user
// GET /users/me
usersRouter.get("/me", authenticateToken, function (req, res) {
  Promise.resolve()
    .then(function () {
      return User.findByPk(req.userId);
    })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.json(user);
    })
    .catch(() => {
      return res.status(400).json({ error: "Cannot get user" });
    });
});

// GET /users/count
usersRouter.get("/count", function (req, res) {
  Promise.resolve()
    .then(function () {
      return User.count().then((count) => {
        return res.json({ count });
      });
    })
    .catch(() => {
      return res.status(400).json({ error: "Cannot get users" });
    });
});

/* Gallery Routes */
// Paginated List of Users
// GET /users?page=<page>
usersRouter.get("/", function (req, res) {
  Promise.resolve().then(function () {
    const offset = parseInt(req.query.page) || 0;
    const limit = 1;

    if (offset === undefined || isNaN(offset)) {
      return res.status(400).json({
        error: "Integer page query parameter is required.",
      });
    }
    // Validate Offset an a Param
    if (offset < 0) {
      return res.status(400).json({
        error: `Invalid page query parameter.`,
      });
    }

    const userQuery = User.findAll({
      offset: offset * limit,
      limit: limit,
      order: [["createdAt", "ASC"]],
      attributes: ["id", "username"],
    });
    return userQuery.then((users) => {
      if (!users || users.length === 0) {
        return res.json([]);
      }
      return res.json(users);
    });
  });
});

// Get Paginated Image
// GET /users/:userId/images?page=<page>
usersRouter.get("/:userId/images", function (req, res) {
  Promise.resolve().then(function () {
    const userId = parseInt(req.params.userId);
    const offset = parseInt(req.query.page);
    const limit = 1;

    if (offset === undefined || isNaN(offset)) {
      return res.status(400).json({
        error: "Integer page query parameter is required.",
      });
    }
    if (offset < 0) {
      return res.status(400).json({
        error: `Invalid page query parameter.`,
      });
    }
    if (userId === undefined || isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        error: `Invalid user ID: ${req.params.userId}`,
      });
    }
    const imageQuery = Image.findAll({
      where: {
        UserId: userId,
      },
      offset: offset * limit,
      limit: limit,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          attributes: ["id", "username"],
        },
      ],
    });
    return imageQuery.then((images) => {
      if (!images || images.length === 0) {
        return res.json([]);
      }
      return res.json(images);
    });
  });
});

// Get total number of images
// GET /users/:userId/images/count
usersRouter.get("/:userId/images/count", function (req, res) {
  Promise.resolve().then(function () {
    const userId = parseInt(req.params.userId);
    if (userId === undefined || isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        error: `Invalid user ID: ${req.params.userId}`,
      });
    }
    return Image.count({
      where: {
        UserId: userId,
      },
    }).then((count) => {
      return res.json({ count: count });
    });
  });
});
