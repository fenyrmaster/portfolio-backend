const express = require('express');
const blogController = require("../controllers/blogController");
const authController = require("../controllers/authController");

const projectRouter = express.Router();

projectRouter
    .route("/")
    .get(blogController.getEntries)
    //.post(authController.protect, projectController.uploadProjectPics, projectController.createProject);

// projectRouter
//     .route("/:id")
//     .get(projectController.getBySlug)
//     .patch(authController.protect, projectController.uploadProjectPics, projectController.editProject)
//     .delete(authController.protect, projectController.deleteProject);
    
module.exports = projectRouter;