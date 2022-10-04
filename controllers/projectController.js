const catchAsync = require("../utils/catchAsync");
const multer = require("multer");
const sharp = require("sharp");
const ApiErrors = require("../utils/appError");
const uuid = require("uuid");
const cloudinary = require("cloudinary").v2;
const Project = require("../models/projectModel");
const APIfeatures = require("../utils/APIFeatures");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")){
        cb(null, true)
    } else {
        cb(new CustomError("Not a image, please upload an actual image", 400), false)
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.getProjects = catchAsync(async(req, res, next) => {
    const features = new APIfeatures(Project.find(), req.query).filter().sort().limits().pagination();
    const projects = await features.query;
    res.status(200).json({
        status: "success",
        quantity: projects.length,
        message: "Projects found",
        data: projects
    })
});