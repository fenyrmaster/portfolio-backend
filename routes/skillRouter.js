const express = require('express');
const skillController = require("../controllers/skillController");

const skillRouter = express.Router();

skillRouter
    .route("/")
    .get(skillController.getSkill)
    .post(skillController.uploadSkillImg, skillController.createSkill);

module.exports = skillRouter;