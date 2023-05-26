const catchAsync = require("../utils/catchAsync");
const multer = require("multer");
const sharp = require("sharp");
const ApiErrors = require("../utils/appError");
const uuid = require("uuid");
const cloudinary = require("cloudinary").v2;
const Blog = require("../models/blogModel");
const APIfeatures = require("../utils/APIFeatures");

exports.getEntries = catchAsync(async(req, res, next) => {
    const features = new APIfeatures(Blog.find(), req.query).filter().sort().limits().pagination();
    const entries = await features.query;
    res.status(200).json({
        status: "success",
        quantity: entries.length,
        message: "Entries found",
        data: entries
    })
});