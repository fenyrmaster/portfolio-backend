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

const crearFoto = async (request, oldPic) => {
    //Importar informacion de cloudinary
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_KEY,
        api_secret: process.env.CLOUDINARY_SECRET,
        secure: true
    });

    //Editar la imagen y guardarla en cloudinary
    const imagenProyecto = `proyecto-${uuid.v4()}-${request.body.nombre}`;
    await sharp(request.files.imagenPortada[0].buffer).resize(1000,500).toFormat("jpeg").jpeg({quality: 90}).toFile(`public/img/projects/${imagenProyecto}`);
    await cloudinary.uploader.upload(`public/img/projects/${imagenProyecto}`,{
        resource_type: "image",
        public_id: imagenProyecto
    });
    //Eliminar la imagen (solo si se desea cambiar)
    if(oldPic){
        let photo = oldPic.split("/");
        await cloudinary.uploader.destroy(photo[photo.length - 1]);
    }
    
    //Obtener el url de la imagen y guardarla
    let url = await cloudinary.image(imagenProyecto);
    let urlCortada = url.split("=")[1].split("'")[1];
    request.body.image = urlCortada;

    // Proceso para todas las imagenes
    if(req.files.imagenes){
        await Promise.all(req.files.imagenes.map(async(file, index) => {
            const filename = `proyecto-gal-${uuid.v4()}-${request.body.nombre}`;
            await sharp(req.files.imagenes[index].buffer).toFormat("jpeg").jpeg({quality: 90}).toFile(`public/img/projects/${filename}`);
            await cloudinary.uploader.upload(`public/img/projects/${filename}`,{
                resource_type: "image",
                public_id: filename
            });
            let urlAqui = cloudinary.image(filename);
            req.body.gallery.push(urlAqui.split("=")[1].split("'")[1]);
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
    if(!req.files){
        const err = new ApiErrors(`You have to add an image, its required`, 404);
        return next(err);
    }
    await crearFoto(req);

    // Crear la nueva skill
    const newProject = await Project.create({
        nombre: req.body.nombre,
        image: req.body.image,
        focus: req.body.focus,
        usage: req.body.usage,
        text: req.body.text,
        completionDate: req.body.completionDate,
        technologies: req.body.technologies,
        githubUrl: req.body.githubUrl,
        liveUrl: req.body.liveUrl,
        gallery: req.body.gallery
    });

    res.status(201).json({
        status: "success",
        message: "Proyecto creada con exito",
        data: newProject
    })
});