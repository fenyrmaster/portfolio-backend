const express = require('express');
const skillController = require("../controllers/skillController");
const authController = require("../controllers/authController");

const skillRouter = express.Router();

skillRouter
    .route("/")
    .get(skillController.getSkills)
    .post(authController.protect, skillController.uploadSkillImg, skillController.createSkill);

skillRouter
    .route("/:id")
    .get(skillController.getSkill)
    .patch(authController.protect, skillController.uploadSkillImg, skillController.editSkill)
    .delete(authController.protect, skillController.deleteSkill);

module.exports = skillRouter;