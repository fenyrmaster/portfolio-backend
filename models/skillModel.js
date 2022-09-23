const mongoose = require("mongoose");

const skillModel = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
    },
    level: {
        type: String,
        required: true,
        enum: ["Beginner", "Intermediate", "Advanced"]
    },
    image: {
        type: String,
        required: true
    }
});

const Skill = mongoose.model("Skill", skillModel);
module.exports = Skill;