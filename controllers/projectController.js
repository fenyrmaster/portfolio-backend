const catchAsync = require("../utils/catchAsync");
const multer = require("multer");
const sharp = require("sharp");
const ApiErrors = require("../utils/appError");
const uuid = require("uuid");
const cloudinary = require("cloudinary").v2;
const Project = require("../models/projectModel");
const APIfeatures = require("../utils/APIFeatures");
const { json } = require("express");

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
    if(request.files.imagenPortada){
        const imagenProyecto = `proyecto-${uuid.v4()}`;
        await sharp(request.files.imagenPortada[0].buffer).resize(1000,500).toFormat("jpeg").jpeg({quality: 90}).toFile(`public/img/projects/${imagenProyecto}`);
        await cloudinary.uploader.upload(`public/img/projects/${imagenProyecto}`,{
            resource_type: "image",
            public_id: imagenProyecto
        });
        //Obtener el url de la imagen y guardarla
        let url = await cloudinary.image(imagenProyecto);
        let urlCortada = url.split("=")[1].split("'")[1];
        request.body.image = urlCortada;
    }

    //Eliminar la imagen (solo si se desea cambiar)
    if(oldPic){
        let photo = oldPic.split("/");
        await cloudinary.uploader.destroy(photo[photo.length - 1]);
    }
    
    // Proceso para todas las imagenes
    if(request.files.imagenes){
        request.body.gallery = [];
        await Promise.all(request.files.imagenes.map(async(file, index) => {
            const filename = `proyecto-gal-${uuid.v4()}`;
            await sharp(request.files.imagenes[index].buffer).toFormat("jpeg").jpeg({quality: 90}).toFile(`public/img/projects/${filename}`);
            await cloudinary.uploader.upload(`public/img/projects/${filename}`,{
                resource_type: "image",
                public_id: filename
            });
            let urlAqui = cloudinary.image(filename);
            request.body.gallery.push(urlAqui.split("=")[1].split("'")[1]);
        }));
    }
};

exports.uploadProjectPics = upload.fields([
    { name: "imagenPortada", maxCount: 1 },
    { name: "imagenes", maxCount: 12 }
]);

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

exports.createProject = catchAsync(async(req, res, next) => {
    let text = JSON.parse(req.body.text);
    if(!req.files){
        const err = new ApiErrors(`You have to add an image, its required`, 404);
        return next(err);
    }
    await crearFoto(req);

    // Crear el nuevo proyecto
    const newProject = await Project.create({
        nombre: req.body.nombre,
        image: req.body.image,
        focus: req.body.focus,
        usage: req.body.usage,
        text: text,
        completionDate: req.body.completionDate,
        githubUrl: req.body.githubUrl,
        liveUrl: req.body.liveUrl,
        gallery: req.body.gallery
    });

    let reformat = req.body.technologies.split(",");
    reformat.forEach(el => {
        newProject.technologies.push(el);
    });
    await newProject.save();

    res.status(201).json({
        status: "success",
        message: "Proyecto creada con exito",
        data: newProject
    })
});

exports.deleteProject = catchAsync(async(req, res, next) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_KEY,
        api_secret: process.env.CLOUDINARY_SECRET,
        secure: true
    });
    const project = await Project.findById(req.params.id);
    if(!project) {
        return next(new ApiErrors(`The document with this id (${req.params.id}) doesnt exist`, 404))
    }
    // Delete the thumbnail image
    let photo = project.image.split("/");
    console.log(photo);
    await cloudinary.uploader.destroy(photo[photo.length - 1]);
    // Delete the gallery images
    project.gallery.forEach(async (img) => {
        let pic = img.split("/");
        await cloudinary.uploader.destroy(pic[pic.length - 1]);
    })
    await project.delete();
    res.status(204).json({
        status: "success",
        message: "Project deleted.",
        data: null
    })
});

exports.editProject = catchAsync(async(req, res, next) => {
    const projectOld = await Project.findById(req.params.id);
    if(!projectOld) {
        return next(new ApiErrors(`The document with this id (${req.params.id}) doesnt exist`, 404))
    }
    let text = JSON.parse(req.body.text);
    if(Object.keys(req.files).length !== 0){
        let oldPic = projectOld.image;
        await crearFoto(req, oldPic);
    }

    const project = await Project.findByIdAndUpdate(req.params.id, {
        nombre: req.body.nombre,
        focus: req.body.focus,
        usage: req.body.usage,
        text: text,
        completionDate: req.body.completionDate,
        githubUrl: req.body.githubUrl,
        liveUrl: req.body.liveUrl
    }, {
        new: true,
        runValidators: true
    });
    project.technologies = [];
    let reformat = req.body.technologies.split(",");
    reformat.forEach(el => {
        project.technologies.push(el);
    });
    if(req.body.image){
        project.image = req.body.image;
    }
    if(req.body.gallery){
        project.gallery = req.body.gallery;
    }
    await project.save();

    res.status(200).json({
        status: "success",
        message: "Skill Editada con exito",
        data: project
    })
});

exports.getBySlug = catchAsync(async(req, res, next) => {
    const project = await Project.findOne({slug: req.params.id});
    if(!project){
        return next(new ApiErrors(`The project with the slug ${req.params.slug} doesn't exist`, 404));
    }
    res.status(200).json({
        message: "Project found",
        data: project
    })
});