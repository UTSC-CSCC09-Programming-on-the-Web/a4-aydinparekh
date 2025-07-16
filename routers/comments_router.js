import { Comment } from "../models/comments.js";
import { Image } from "../models/images.js";
import { User } from "../models/users.js";
import { Router } from "express";
import { validateInput } from "../utils/validate-input.js";
import { authenticateToken } from "../middleware/auth.js";

export const commentsRouter = Router({ mergeParams: true });

// Add a new comment to a specific image
// POST /images/:imageId/comments
commentsRouter.post("/", authenticateToken, function (req, res) {
  Promise.resolve().then(function () {
    // Validate image ID as a number
    const imageId = parseInt(req.params.imageId);
    if (isNaN(imageId) || imageId <= 0) {
      return res.status(400).json({
        error: `Invalid image ID: ${req.params.imageId}`,
      });
    }
    return Image.findByPk(req.params.imageId).then((image) => {
      if (!image) {
        return res.status(404).json({
          error: `Image ${req.params.imageId} not found`,
        });
      }
      const schema = [
        {
          name: "content",
          required: true,
          type: "string",
          location: "body",
        },
      ];
      if (!validateInput(req, res, schema)) return;

      return Comment.create({
        ImageId: image.id,
        content: req.body.content,
        UserId: req.userId,
      })
        .then((comment) => res.json(comment))
        .catch((e) => {
          if (e.name === "SequelizeValidationError") {
            return res.status(422).json({ error: "Invalid input parameters" });
          } else if (e.name === "SequelizeForeignKeyConstraintError") {
            return res.status(422).json({
              error: `Image ${req.params.imageId} does not exist`,
            });
          } else {
            return res.status(400).json({ error: "Cannot create comment" });
          }
        });
    });
  });
});

// Get the total number of comments for a specific image
// GET /images/:imageId/comments/count
commentsRouter.get("/count", authenticateToken, function (req, res) {
  Promise.resolve().then(function () {
    // Validate image ID as a number
    const imageId = parseInt(req.params.imageId);
    if (isNaN(imageId) || imageId <= 0) {
      return res.status(400).json({
        error: `Invalid image ID: ${req.params.imageId}`,
      });
    }
    return Image.findByPk(req.params.imageId).then((image) => {
      if (!image) {
        return res
          .status(404)
          .json({ error: `Image ${req.params.imageId} not found` });
      }
      return Comment.count({
        where: { ImageId: req.params.imageId },
      }).then((count) => res.json({ count }));
    });
  });
});

// Delete a comment from a specific image
// DELETE /images/:imageId/comments/:commentId
commentsRouter.delete("/:commentId", authenticateToken, function (req, res) {
  Promise.resolve().then(function () {
    // Validate image ID as a number
    const imageId = parseInt(req.params.imageId);
    if (isNaN(imageId) || imageId <= 0) {
      return res.status(400).json({
        error: `Invalid image ID: ${req.params.imageId}`,
      });
    }
    // Validate comment ID as a number
    const commentId = parseInt(req.params.commentId);
    if (isNaN(commentId) || commentId <= 0) {
      return res.status(400).json({
        error: `Invalid comment ID: ${req.params.commentId}`,
      });
    }
    return Image.findByPk(req.params.imageId).then((image) => {
      if (!image) {
        return res
          .status(404)
          .json({ error: `Image ${req.params.imageId} not found` });
      }
      return Comment.findByPk(req.params.commentId).then((comment) => {
        if (!comment) {
          return res.status(404).json({
            error: `Comment ${req.params.commentId} not found on image ${req.params.imageId}`,
          });
        }
        // Check if the comment belongs to the authenticated user
        // Or the user owns the image
        if (comment.UserId !== req.userId && image.UserId !== req.userId) {
          return res.status(403).json({
            error: "You do not have permission to delete this comment.",
          });
        }
        // Delete the comment
        return Comment.destroy({
          where: {
            id: req.params.commentId,
            ImageId: req.params.imageId,
          },
        }).then(() =>
          res.json({
            success: true,
            imageId: req.params.imageId,
            deletedCommentId: req.params.commentId,
          }),
        );
      });
    });
  });
});

// Get a single comment by ID for a specific image
// GET /images/:imageId/comments/:commentId
commentsRouter.get("/:commentId", authenticateToken, function (req, res) {
  Promise.resolve().then(function () {
    // Validate image ID as a number
    const imageId = parseInt(req.params.imageId);
    if (isNaN(imageId) || imageId <= 0) {
      return res.status(400).json({
        error: `Invalid image ID: ${req.params.imageId}`,
      });
    }
    // Validate comment ID as a number
    const commentId = parseInt(req.params.commentId);
    if (isNaN(commentId) || commentId <= 0) {
      return res.status(400).json({
        error: `Invalid comment ID: ${req.params.commentId}`,
      });
    }
    return Image.findByPk(imageId).then((image) => {
      if (!image) {
        return res.status(404).json({ error: `Image ${imageId} not found` });
      }
      return Comment.findByPk(commentId).then((comment) => {
        if (!comment) {
          return res.status(404).json({
            error: `Comment ${commentId} not found on image ${imageId}`,
          });
        }
        return res.json(comment);
      });
    });
  });
});

// Get comments for a specific image with pagination
// GET /images/:imageId/comments?page=<page>&limit=<limit>
commentsRouter.get("/", authenticateToken, function (req, res) {
  Promise.resolve().then(function () {
    // Validate query parameters
    const page = req.query.page !== undefined ? parseInt(req.query.page) : 0;
    const limit =
      req.query.limit !== undefined ? parseInt(req.query.limit) : 10;

    if (
      (req.query.page !== undefined && (isNaN(page) || page < 0)) ||
      (req.query.limit !== undefined && (isNaN(limit) || limit <= 0))
    ) {
      return res.status(400).json({
        error: "Invalid page or limit query parameter.",
      });
    }

    // Validate image ID as a number
    const imageId = parseInt(req.params.imageId);
    if (isNaN(imageId) || imageId <= 0) {
      return res.status(400).json({
        error: `Invalid image ID: ${req.params.imageId}`,
      });
    }

    return Image.findByPk(imageId).then((image) => {
      if (!image) {
        return res.status(404).json({ error: `Image ${imageId} not found` });
      }

      return Comment.findAll({
        where: { ImageId: image.id },
        offset: page * limit,
        limit: limit,
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: User,
            attributes: ["id", "username"],
          },
        ],
      }).then((comments) => {
        return res.json({
          comments,
          pagination: { page, limit, total: comments.length },
        });
      });
    });
  });
});
