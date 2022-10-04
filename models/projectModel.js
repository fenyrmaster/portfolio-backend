const mongoose = require("mongoose");

const projectModel = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    slug: String,
    focus: {
        type: String,
        required: true,
        enum: ["Front-end", "Back-end", "Full-Stack"]
    },
    usage:{
        type: String,
        required: true,
        enum: ["Learning Project", "Real Project"]
    },
    text: [
        {
            textType: String,
            textContent: [],
        }
    ],
    imageThumbnail: {
        type: String,
        required: true
    },
    completionDate: {
        type: Date,
        required: true
    },
    technologies: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "Skill"
        }
    ],
    githubUrl: {
        type: String,
        required: true
    },
    liveUrl: {
        type: String,
        required: true
    },
    gallery: [String]
});

projectModel.pre("save", function(next) {
    this.slug = slugify(this.name, {lower: true});
    next();
});

const Project = mongoose.model("Project", projectModel);
module.exports = Project;