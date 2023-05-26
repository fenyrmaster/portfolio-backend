const mongoose = require("mongoose");
const slugify = require("slugify");

const blogModel = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    intro: {
        type: String,
        required: true,
        trim: true
    },
    slug: String,
    time: {
        type: String,
        required: true,
        trim: true
    },
    postDate: {
        type: Date,
        required: true
    },
    text: []
});

blogModel.pre("save", function(next) {
    this.slug = slugify(this.nombre, {lower: true});
    next();
});

const Blog = mongoose.model("Blog", blogModel);
module.exports = Blog;