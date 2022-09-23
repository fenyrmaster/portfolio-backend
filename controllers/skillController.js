const catchAsync = require("../utils/catchAsync");
const multer = require("multer");
const sharp = require("sharp");
const ApiErrors = require("../utils/appError");
const uuid = require("uuid");
const cloudinary = require("cloudinary").v2;
const Skill = require("../models/skillModel");

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

exports.uploadSkillImg = upload.single("imageSkill");

exports.getSkill = catchAsync(async(req, res, next) => {
    res.status(200).json({
        message: "This is a initial attempt, hold it"
    })
});

exports.createSkill = catchAsync(async(req, res, next) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_KEY,
        api_secret: process.env.CLOUDINARY_SECRET,
        secure: true
    });
    if(!req.file){
        const err = new ApiErrors(`You have to add an image, its required`, 404);
        return next(err);
    }

    //Editar la imagen y guardarla en cloudinary
    const imagenSkill = `skill-${uuid.v4()}-${req.body.nombre}`;
    await sharp(req.file.buffer).resize(500,500).toFormat("jpeg").jpeg({quality: 90}).toFile(`public/img/skills/${imagenSkill}`);
    await cloudinary.uploader.upload(`public/img/skills/${imagenSkill}`,{
        resource_type: "image",
        public_id: imagenSkill
    });

    //Obtener el url de la imagen y guardarla
    let url = cloudinary.image(imagenSkill);
    let urlCortada = url.split("=")[1].split("'")[1];
    req.body.image = urlCortada;

    // Crear la nueva skill
    const newSkill = await Skill.create({
        nombre: req.body.nombre,
        image: req.body.image,
        level: req.body.level
    });

    res.status(201).json({
        message: "Skill creada con exito",
        data: newSkill
    })
})