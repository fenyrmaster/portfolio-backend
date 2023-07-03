const catchAsync = require("../utils/catchAsync");
const multer = require("multer");
const sharp = require("sharp");
const ApiErrors = require("../utils/appError");
const uuid = require("uuid");
const cloudinary = require("cloudinary").v2;
const Blog = require("../models/blogModel");
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
    if(request.file){
        const imagenBlog = `blog-${uuid.v4()}`;
        await sharp(request.file.buffer).resize(1000,500).toFormat("jpeg").jpeg({quality: 90}).toFile(`public/img/blogs/${imagenBlog}`);
        await cloudinary.uploader.upload(`public/img/blogs/${imagenBlog}`,{
            resource_type: "image",
            public_id: imagenBlog
        },function(error, result) {console.log(error, result); });
        //Obtener el url de la imagen y guardarla
        let url = await cloudinary.image(imagenBlog);
        let urlCortada = url.split("=")[1].split("'")[1];
        request.body.image = urlCortada;
    }

    //Eliminar la imagen (solo si se desea cambiar)
    if(oldPic){
        let photo = oldPic.split("/");
        await cloudinary.uploader.destroy(photo[photo.length - 1]);
    }
};

exports.uploadEntryThumbnail = upload.single("imagenPortada");

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

exports.createEntry = catchAsync(async(req, res, next) => {
    let text = JSON.parse(req.body.text);
    if(!req.file){
        const err = new ApiErrors(`You have to add an image, its required`, 404);
        return next(err);
    }
    await crearFoto(req);
    // Crear el nuevo proyecto
    const newEntry = await Blog.create({
        nombre: req.body.nombre,
        image: req.body.image,
        intro: req.body.intro,
        time: req.body.time,
        postDate: req.body.postDate,
        text: text
    });

    res.status(201).json({
        status: "success",
        message: "Entrada creada con exito",
        data: newEntry
    })
});

exports.deleteEntry = catchAsync(async(req, res, next) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_KEY,
        api_secret: process.env.CLOUDINARY_SECRET,
        secure: true
    });
    const entry = await Blog.findById(req.params.id);
    if(!entry) {
        return next(new ApiErrors(`The entry with this id (${req.params.id}) doesnt exist`, 404))
    }
    // Delete the thumbnail image
    let photo = entry.image.split("/");
    await cloudinary.uploader.destroy(photo[photo.length - 1]);
    await entry.delete();
    res.status(204).json({
        status: "success",
        message: "Entry deleted.",
        data: null
    })
});

exports.editEntry = catchAsync(async(req, res, next) => {
    const entryOld = await Blog.findById(req.params.id);
    if(!entryOld) {
        return next(new ApiErrors(`The entry with this id (${req.params.id}) doesnt exist`, 404))
    }
    let text = JSON.parse(req.body.text);
    // If we want to change the image, we set the old one, so we can delete it from our cloud storage
    if(req.file){
        let oldPic = entryOld.image;
        await crearFoto(req, oldPic);
    }

    const newEntry = await Blog.findByIdAndUpdate(req.params.id, {
        nombre: req.body.nombre,
        intro: req.body.intro,
        time: req.body.time,
        postDate: req.body.postDate,
        text: text
    }, {
        new: true,
        runValidators: true
    });
    if(req.body.image){
        newEntry.image = req.body.image;
    }
    await newEntry.save();

    res.status(200).json({
        status: "success",
        message: "Entrada Editada con exito",
        data: newEntry
    })
});

exports.getBySlug = catchAsync(async(req, res, next) => {
    const entry = await Blog.findOne({slug: req.params.id});
    if(!entry){
        return next(new ApiErrors(`The entry with the slug ${req.params.slug} doesn't exist`, 404));
    }
    entry.views = entry.views + 1;
    await entry.save();
    res.status(200).json({
        message: "Entry found",
        data: entry
    })
});