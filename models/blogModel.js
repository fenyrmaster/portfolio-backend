const mongoose = require("mongoose");
const slugify = require("slugify");

const blogModel = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    views: {
        type: Number,
        default: 0
    },
    intro: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true
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