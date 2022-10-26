const express = require('express');
const projectController = require("../controllers/projectController");
const authController = require("../controllers/authController");

const projectRouter = express.Router();

projectRouter
    .route("/")
    .get(projectController.getProjects)
    .post(authController.protect, projectController.uploadProjectPics, projectController.createProject);

projectRouter
    .route("/:id")
    .get(projectController.getBySlug)
    .patch(authController.protect, projectController.uploadProjectPics, projectController.editProject)
    .delete(authController.protect, projectController.deleteProject);

// Routes for other purposes
projectRouter.route("/email").post(projectController.sendEmails);
projectRouter.route("/access").post(authController.login);
projectRouter.route("/validate/data").get(authController.validate);
    
module.exports = projectRouter;