const catchAsync = require("../utils/catchAsync");
const multer = require("multer");
const sharp = require("sharp");
const ApiErrors = require("../utils/appError");
const uuid = require("uuid");
const cloudinary = require("cloudinary").v2;
const Skill = require("../models/skillModel");
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

const crearFoto = async (request, oldPic) => {
    //Importar informacion de cloudinary
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_KEY,
        api_secret: process.env.CLOUDINARY_SECRET,
        secure: true
    });

    //Editar la imagen y guardarla en cloudinary
    const imagenSkill = `skill-${uuid.v4()}-${request.body.nombre}`;
    await sharp(request.file.buffer).resize(500,500).toFormat("jpeg").jpeg({quality: 90}).toFile(`public/img/skills/${imagenSkill}`);
    await cloudinary.uploader.upload(`public/img/skills/${imagenSkill}`,{
        resource_type: "image",
        public_id: imagenSkill
    });
    //Eliminar la imagen (solo si se desea cambiar)
    if(oldPic){
        let photo = oldPic.split("/");
        await cloudinary.uploader.destroy(photo[photo.length - 1]);
    }
    
    //Obtener el url de la imagen y guardarla
    let url = await cloudinary.image(imagenSkill);
    let urlCortada = url.split("=")[1].split("'")[1];
    request.body.image = urlCortada;
}

exports.uploadSkillImg = upload.single("image");

exports.getSkills = catchAsync(async(req, res, next) => {
    const features = new APIfeatures(Skill.find(), req.query).filter().sort().limits().pagination();
    const skills = await features.query;
    res.status(200).json({
        status: "success",
        quantity: skills.length,
        message: "skills found",
        data: skills
    })
});

exports.getSkill = catchAsync(async(req, res, next) => {
    const skill = await Skill.findById(req.params.id);
    if(!skill) {
        return next(new ApiErrors("La skill solicitada no existe", 404));
    }
    res.status(200).json({
        status: "success",
        message: "Skill found",
        data: skill
    });
});

exports.editSkill = catchAsync(async(req, res, next) => {
    const skillOld = await Skill.findById(req.params.id);
    if(!skillOld) {
        return next(new ApiErrors(`The document with this id (${req.params.id}) doesnt exist`, 404))
    }
    if(req.file){
        let oldPic = skillOld.image;
        await crearFoto(req, oldPic);
    }

    const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: "success",
        message: "Skill Editada con exito",
        data: skill
    })
});

exports.createSkill = catchAsync(async(req, res, next) => {
    if(!req.file){
        const err = new ApiErrors(`You have to add an image, its required`, 404);
        return next(err);
    }
    await crearFoto(req);

    // Crear la nueva skill
    const newSkill = await Skill.create({
        nombre: req.body.nombre,
        image: req.body.image,
        level: req.body.level,
        role: req.body.role
    });

    res.status(201).json({
        status: "success",
        message: "Skill creada con exito",
        data: newSkill
    })
});

exports.deleteSkill = catchAsync(async(req, res, next) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_KEY,
        api_secret: process.env.CLOUDINARY_SECRET,
        secure: true
    });
    const skill = await Skill.findById(req.params.id);
    if(!skill) {
        return next(new ApiErrors(`The document with this id (${req.params.id}) doesnt exist`, 404))
    }
    let photo = skill.image.split("/");
    await cloudinary.uploader.destroy(photo[photo.length - 1]);
    await skill.delete();
    res.status(204).json({
        status: "success",
        message: "Skill deleted.",
        data: null
    })
});