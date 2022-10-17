const express = require('express');
const projectController = require("../controllers/projectController");

const projectRouter = express.Router();

projectRouter
    .route("/")
    .get(projectController.getProjects)
    .post(projectController.uploadProjectPics, projectController.createProject);

projectRouter
    .route("/:id")
    .get(projectController.getBySlug)
    .patch(projectController.uploadProjectPics, projectController.editProject)
    .delete(projectController.deleteProject);
    
module.exports = projectRouter;