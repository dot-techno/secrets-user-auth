//jshint esversion:6

// Version 4
// Use passport package to do authentication
//

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";


// define env vars in .env file for development
dotenv.config(); // creates process.env object with env vars

const APP_PORT = 3000;
const DB_URI = 'mongodb://localhost:27017/secretsDB';
const HTTP_CREATED = 201; // http code
const HTTP_OK = 200;
const HTTP_SERVER_ERROR = 500;


const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

// set up settings for session
app.use(session({
    secret: process.env.ENCRYPTION_KEY,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect(DB_URI);



// Schema and Models
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());
// use functions from passportLocalMongoose to serialize and deserialize 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", async function(req, res){
    res.render("home");

});

app.get("/login", async function(req, res){
    res.render("login");
});

app.get("/register", async function(req, res){
    res.render("register");
});

app.get("/secrets", function(req, res){
    if (req.isAuthenticated()){
        console.log("Request is authenticated!");
        res.render("secrets");
    }else {
        console.log(req.isAuthenticated());
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res, next){
    req.logout(function(err){
        if(err){
            console.log(err.message);
            next(err);
        }
    });
    res.redirect("/");
});



app.post("/login", async function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password,
    });
    console.log(user);
    req.login(user, function(err){
        if(err){
            console.log(err.message);
            res.redirect("/login");
        }else {
            console.log("calling passport authenticate");
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });

        }
    });
});



app.post("/register", async function(req, res){

  try{
    await User.register(new User({username: req.body.username}), req.body.password);
    passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
    });
  }
  catch(err){
    console.log(err.message);
    return res.redirect("/register");
  }

});


app.post("/submit", async function(req, res){

});




app.listen(APP_PORT, function(err){
    if(err) console.log(err);

    console.log("Server listening on port: "+ APP_PORT);
});
