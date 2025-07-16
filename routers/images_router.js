import { Image } from "../models/images.js";

import { Router } from "express";
import multer from "multer";
import path from "path";

import { validateInput } from "../utils/validate-input.js";
import { authenticateToken } from "../middleware/auth.js";

const upload = multer({ dest: "uploads/" });
export const imagesRouter = Router();

// Add a new image
// POST /images
imagesRouter.post(
  "/",
  authenticateToken,
  upload.single("image"),
  function (req, res) {
    Promise.resolve().then(function () {
      // Validate Input
      const schema = [
        {
          name: "title",
          required: true,
          type: "string",
          location: "body",
        },
        {
          name: "image",
          required: true,
          type: "file",
          location: "file",
        },
      ];
      if (!validateInput(req, res, schema)) return;

      return Image.create({
        title: req.body.title,
        imageMetadata: req.file,
        UserId: req.userId,
      })
        .then((image) => {
          return res.json(image);
        })
        .catch((e) => {
          if (e.name === "SequelizeValidationError") {
            return res.status(422).json({
              error: "Invalid input parameters",
            });
          } else {
            return res.status(400).json({ error: "Cannot create image" });
          }
        });
    });
  },
);

// Get Image by ID
// GET /images/:id
imagesRouter.get("/:id", function (req, res) {
  Promise.resolve().then(function () {
    // Validate ID as a number
    const imageId = parseInt(req.params.id);
    if (isNaN(imageId) || imageId <= 0) {
      return res.status(400).json({
        error: `Invalid image ID: ${req.params.id}`,
      });
    }
    return Image.findByPk(imageId).then((image) => {
      if (!image) {
        return res.status(404).json({
          error: `Image ${imageId} not found`,
        });
      }
      // Return image metadata as JSON
      return res.json(image);
    });
  });
});

// Serve image file
// GET /images/:id/file
imagesRouter.get("/:id/file", function (req, res) {
  Promise.resolve().then(function () {
    const imageId = parseInt(req.params.id);
    if (isNaN(imageId) || imageId <= 0) {
      return res.status(400).json({
        error: `Invalid image ID: ${req.params.id}`,
      });
    }
    return Image.findByPk(imageId).then((image) => {
      if (!image) {
        return res.status(404).json({
          error: `Image ${imageId} not found`,
        });
      }
      res.setHeader("Content-Type", image.imageMetadata.mimetype);
      res.sendFile(image.imageMetadata.path, { root: path.resolve() });
    });
  });
});

// Delete Image by ID
// DELETE /images/:id
imagesRouter.delete("/:id", authenticateToken, function (req, res) {
  Promise.resolve().then(function () {
    const imageId = parseInt(req.params.id);
    if (isNaN(imageId) || imageId <= 0) {
      return res.status(400).json({
        error: `Invalid image ID: ${req.params.id}`,
      });
    }
    return Image.findByPk(imageId).then((image) => {
      if (!image) {
        return res.status(404).json({
          error: `Image ${imageId} not found`,
        });
      }
      // Check if the auth user is the owner of the image
      if (image.UserId !== req.userId) {
        return res.status(403).json({
          error: "You do not have permission to delete this image.",
        });
      }
      return Image.destroy({
        where: {
          id: imageId,
        },
      }).then(() => {
        return res.json({
          success: true,
          deleted: image,
        });
      });
    });
  });
});
