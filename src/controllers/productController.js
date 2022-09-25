const db = require('../dataBase/models');
const path = require('path');
const fs = require('fs');
const { validationResult } = require("express-validator");

//const universalModel = require('../model/universalModel'); 
//const productModel = universalModel('products');
const toThousand = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const productController = {

    listadoProductos: async (req,res) =>{
        try {
            const allProducts = await db.Products.findAll({
                include: [db.Images]
            }) // productos todo lo que labura con el array de productos va con allproducts
            const table = allProducts.filter( product => product.category == "table" );
            const coffeeTable = allProducts.filter( product => product.category == "coffeeTable" );
            const desk = allProducts.filter( product => product.category == "desk" );
            const mirror = allProducts.filter( product => product.category == "mirror" );
            
            res.render("productos/products",
            {
                title: "Productos",
                table,
                coffeeTable,
                desk,
                mirror
            }
            )
        } catch (error) {
            res.json({error: error.message});
        }
        
    },

    
    carrito:(req,res) =>{
        res.render("productos/productCart",
        {
            title: "Carrito",
            
        }
        )
    },

    // Detail

    detail: async (req,res) =>{
        try {            
            const id = +req.params.id;
            const product = await db.Products.findById(id,{
                include:[db.Images, db.Colors, db.Categories]
            });
            res.render("./productos/productDetail",
            {
                title: "Detalle",
                product,
                toThousand
    
            }
            )
        } catch (error) {
            res.json({error: error.message});
        }

    },

   // Create - Form to create

    create: async (req,res) =>{
        try {
            const colors = await db.Colors.findAll();
            const categories = await db.Categories.findAll()            
            res.render("productos/addProduct", {colors, categories, title: "Crear producto"},)
        } catch (error) {
            res.json({error: error.message}); 
        }
    },

    // Create -  Method to store
    store: async (req, res) => {
		try {
            const files = req.files
            
            const resultadosValidaciones = validationResult(req);
            if (!resultadosValidaciones.isEmpty()){
    
                files.forEach( file => {
                    const filePath = path.join(__dirname, `../../public/images/products/${file.filename}`);
                    fs.unlinkSync(filePath);
                })
                const colors = await db.Colors.findAll();
                const categories = await db.Categories.findAll()
                return res.render('./productos/addProduct', {
                    title: "Crear producto",
                    errors: resultadosValidaciones.mapped(),
                    // oldData son los datos recién cargados es decir el req.body
                    oldData: req.body,
                    colors,
                    categories
                })
            }
            let product = req.body
            let images = []
            const nuevoProducto = await db.Product.create(product);
            for(let i = 0 ; i<files.length;i++) {
                images.push({
                    path: files[i].filename,
                    id_product: nuevoProducto.id
                })
            }
            if (images.length > 0) {
                await db.Images.bulkCreate(images)
                res.redirect('/products')
            } else {
                await db.Images.create([{
                    path: 'default-product-image.png',
                    id_product: nuevoProducto.id
                }])
                res.redirect('/products')
            }
            
        } catch (error) {
            res.json({error: error.message}); 
        }

	},

    // Update - Form to edit

    edit: async (req,res) =>{
        try {
            const productToEdit = await db.Products.findByPk(req.params.id,{
                include:[db.Images, db.Colors, db.Categories]
            });
            const colors = await db.Colors.findAll();
            const categories = await db.Categories.findAll()
            
            res.render("./productos/editProduct",
            {
                title: "Editar producto",
                productToEdit,
                colors,
                categories
            }
            )
        } catch (error) {
            res.json({error: error.message}); 
        }
    },

    // Update - Method to update

    update: async (req, res) => {
		try {
            const files = req.files
            const idToUpdate = req.params.id;
    
            const resultadosValidaciones = validationResult(req);
            console.log(resultadosValidaciones);
           
            // Con este if preguntamos si hay errores de validación
            if (!resultadosValidaciones.isEmpty()){
                console.log("----- ojo HAY ERRORES -----------------")
                
                // Si hay errores borramos los archivos que cargó multer
                files.forEach( file => {
                    const filePath = path.join(__dirname, `../../public/images/products/${file.filename}`);
                    fs.unlinkSync(filePath);
                })
                
                console.log("-------- my body -------------------")
                console.log(req.body);  
                const colors = await db.Colors.findAll();
                const categories = await db.Categories.findAll()    
                const productToEdit = await db.Products.findByPk(idToUpdate);;
    
                return res.render('./productos/editProduct', {
                    title: "Editar producto",
                    productToEdit,
                    errors: resultadosValidaciones.mapped(),
                    oldData: req.body,
                    colors,
                    categories
                })
            }

            let dataUpdate = req.body
            let images = []
            const product = await db.Product.update({
                ...dataUpdate
            }, {
                where: {
                    id: idToUpdate,
                }
            });
            for(let i = 0 ; i<files.length;i++) {
                images.push({
                    path: files[i].filename,
                    id_product: idToUpdate
                })
            }
            if (images.length > 0) {
                const oldImages = await db.Images.findAll({where: {id_product: idToUpdate}})
                oldImages.forEach( image => {
                    fs.unlinkSync(path.resolve(__dirname, '../../public/images/'+image.fileName))
                })
                await db.Images.destroy({where: {id_product: idToUpdate}})
                await db.Images.bulkCreate(images)
                res.redirect('/products')
            } else {
                await db.Images.create([{
                    path: 'default-product-image.png',
                    id_product: nuevoProducto.id
                }])
                res.redirect('/products')
            }
        } catch (error) {
            res.json({error: error.message}); 
        }

	},


    // Update - Method to delete

    destroy: async function(req,res){
        try {
            const { id } = req.params;
            let imagenesBorrar = await db.Images.findAll({where: {id_product: id}});
            if (imagenesBorrar) {
                let filesBorrar = imagenesBorrar.filter(image => image.fileName != 'default-product-image.png');
            for (let i = 0 ; i< filesBorrar.length; i++) {
                fs.unlinkSync(path.resolve(__dirname, '../../public/images/'+filesBorrar[i].fileName))
            }
            };
            await db.Images.destroy({
                where: {
                    product_id: id
                }               
            }, {
                force: true
            })
            await db.Products.destroy({
                where: {
                    id
                }               
            }, {
                force: true
            })
            res.redirect("/");
        } catch (error) {
            res.json({error: error.message}); 
        }

    }

}

module.exports = productController