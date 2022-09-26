const mongoose = require("mongoose");

const skillModel = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    level: {
        type: String,
        required: true,
        enum: ["Beginner", "Intermediate", "Advanced"]
    },
    role: {
        type: String,
        required: true,
        enum: ["Front-end", "Back-end"]
    },
    image: {
        type: String,
        required: true
    }
});

const Skill = mongoose.model("Skill", skillModel);
module.exports = Skill;