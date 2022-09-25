const express = require('express');
const skillController = require("../controllers/skillController");

const skillRouter = express.Router();

skillRouter
    .route("/")
    .get(skillController.getSkills)
    .post(skillController.uploadSkillImg, skillController.createSkill);

skillRouter
    .route("/:id")
    .get(skillController.getSkill)
    .patch(skillController.uploadSkillImg, skillController.editSkill)
    .delete(skillController.deleteSkill);

module.exports = skillRouter;