//const universalModel = require("../model/universalModel");
//const userModel = universalModel("users");
const {Users} = require('../database/models');

const userLoggedMiddleware = async (req, res, next) => {

        if(req.cookies.userEmail) {
            req.session.userLogged = await Users.findOne({where: {'email' : req.cookies.userEmail}});
        }
        res.locals.estaLogueado = req.session.userLogged;
    
    res.locals.estaLogueado = false;


    next();

}

module.exports = userLoggedMiddleware