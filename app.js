//Carregando modulos
const express = require('express');
const { engine } = require ('express-handlebars');
const bodyParser = require('body-parser');
const app = express();
const admin = require("./routes/admin");
const path = require("path");
const mongoose = require('mongoose');
const session = require("express-session");
const flash = require("connect-flash");
const usuarios = require("./routes/usuarios");
const passport = require('passport');

require("./models/Postagem");
const Postagem = mongoose.model("postagens");
require("./models/Categorias");
const Categoria = mongoose.model("categorias");
require("./config/auth")(passport);


  

//Configurações
//Sessão
app.use(session({
    secret: "cursodenode",
    resave: true,
    saveUninitialized: true,
}))

app.use(passport.initialize());
app.use(passport.session());

app.use(flash())

//Middleware
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg")
    res.locals.error_msg = req.flash("error_msg")
    res.locals.error = req.flash("error")
    res.locals.user = req.user || null;
    next()
})

//Body Parser
    app.use(bodyParser.urlencoded({extended: true}))
    app.use(bodyParser.json())

//Handlebars
    app.engine('handlebars', engine());
    app.set('view engine', 'handlebars');
    app.set("views", "./views");

//Mongoose
    mongoose.Promise = global.Promise;
    mongoose.connect("mongodb://localhost/blogapp").then(() => {
        console.log("conectado ao mongo")
    }).catch((err) => {
        console.log("Erro ao se conectar: "+err)
    })

//Public
    app.use(express.static(path.join(__dirname,"public")))
    
//Rotas
app.get('/', (req, res) => {

    Postagem.find().populate("categoria").sort({data: "desc"}).lean().then((postagens) => {
        res.render("index", {postagens: postagens})
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao listar as postagens")
        res.redirect("/404")
    })
    
})

app.get("/postagens/:slug", (req, res) => {
    Postagem.findOne({slug: req.params.slug}).lean().then((postagens) => {
        if(postagens){
            res.render("postagens/index", {postagens: postagens})
        }else{
            req.flash("error_msg", "Esta postagem não existe")
            res.redirect("/")
        }
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro interno")
        res.redirect("/")
    })
})

app.get("/categorias", (req, res) => {
    Categoria.find().sort({date:'desc'}).lean().then((categorias) => {
        res.render("categorias/index", {categorias: categorias})
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao listar as categorias")
        res.redirect("/")
    })
})

app.get("/categorias/:slug", (req, res) => {
    Categoria.findOne({slug: req.params.slug}).lean().then((categoria) => {
        if(categoria){

            Postagem.find({categoria: categoria._id}).lean().then((postagens) => {
                res.render("categorias/postagens", {postagens: postagens, categoria: categoria})

            }).catch((err) => {
                req.flash("error_msg", "Houve um erro ao listar os posts!")
                res.redirect("/")
            })

        }else{
            req.flash("error_msg", "Esta categoria não existe")
            res.redirect("/")
        }

    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao carregar a página desta categoria")
        res.redirect("/")
    })
})

app.get('/404', (req, res) => {
    res.send('Erro 404!')
})

app.use('/admin', admin)

app.use('/usuarios', usuarios)

//Outros
const PORT = 8081
app.listen(PORT,() => {
    console.log("servidor rodando")
})