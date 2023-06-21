const express = require('express');
const blogController = require("../controllers/blogController");
const authController = require("../controllers/authController");

const projectRouter = express.Router();

projectRouter
    .route("/")
    .get(blogController.getEntries)
    .post(authController.protect, blogController.uploadEntryThumbnail, blogController.createEntry);

projectRouter
    .route("/:id")
    .get(blogController.getBySlug)
    .patch(authController.protect, blogController.uploadEntryThumbnail, blogController.editEntry)
    .delete(authController.protect, blogController.deleteEntry);
    
module.exports = projectRouter;