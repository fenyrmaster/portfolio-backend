const JWT = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const ApiErrors = require("../utils/appError");
const { promisify } = require("util");

const points = {
    points: 7,
    duration: 5*60*1000,
    blockDuration: 5*60*1000
}

const signToken = id => {
    return JWT.sign({ id: id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createSendToken = (statusCode, req, res) => {
    const token = signToken(req.body.password);
    res.cookie("jwt", token, {
        maxAge: process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000,
        httpOnly: true,
        secure: true,
        sameSite: "none"
    });

    res.status(statusCode).json({
        status: "success",
        token: token
    })
}

exports.login = catchAsync(async (req,res,next) => {
    if(req.headers.cookie){
        if(req.headers.cookie.includes("LotOfTries=")){
            return next(new ApiErrors("Espera 10 minutos para volver a intentarlo", 400));
        }
    }
    const {password} = req.body;

    if(!password){
        return next(new ApiErrors("please provide a password", 400));
    }
    if(password !== process.env.PASSWORD_ACCESS) {
        points.points = points.points - 1;

        if(points.points === 0){
            points.points = 5;
            res.cookie("LotOfTries", "error", {
                maxAge: 600000,
                secure: true,
                sameSite: "none"
            });
            return next(new ApiErrors("Demasiados intentos fallidos, debes esperar 10 minutos", 400));
        }
        return next(new ApiErrors("Contraseña incorrecta", 400));
    }
    points.points = 5;
    createSendToken(201, req,res);
});

exports.protect = catchAsync(async (req,res,next) => {
    let token
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    } else if(req.cookies.jwt){
        token = req.cookies.jwt;
    }
    if(!token){
        return next(new ApiErrors("Wheres the token lowalski, WHERE IS THE GODAMN TOKEN", 401))
    }
    const decoded = await promisify(JWT.verify)(token,process.env.JWT_SECRET);
    console.log(decoded);
    next();
});

exports.validate = catchAsync(async (req,res,next) => {
    let token
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    } else if(req.cookies.jwt){
        token = req.cookies.jwt;
    }
    if(!token){
        return next(new ApiErrors("Wheres the token lowalski, WHERE IS THE GODAMN TOKEN", 401))
    }
    const decoded = await promisify(JWT.verify)(token,process.env.JWT_SECRET);
    if(decoded.id !== process.env.PASSWORD_ACCESS){
        return next(new ApiErrors("The password is incorrect, you cannot access", 401))
    }
    res.status(200).json({
        status: "Success",
        message: "testing the decoded property"
    })
});