//jshint esversion:6

// Version 2
// This uses a mongoose plug to encrypt passwords stored in the database
//

import express from "express";
import mongoose from "mongoose";
import encrypt from "mongoose-encryption";
import dotenv from "dotenv";

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

mongoose.connect(DB_URI);



// Schema and Models
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
userSchema.plugin(encrypt, {
    secret: process.env.ENCRYPTION_KEY,
    ecryptedFields: ['password']
});

const User = mongoose.model("User", userSchema);


app.get("/", async function(req, res){
    res.render("home");

});

app.get("/login", async function(req, res){
    res.render("login");
});

app.get("/register", async function(req, res){
    res.render("register");
});


app.post("/login", async function(req, res){
    let result = undefined;

    try{
        result = await User.findOne({
            email: req.body.username,
            password: req.body.password
        });
    }catch(err){
        console.log("Error finding user.\n"+ err);
        return res.sendStatus(HTTP_SERVER_ERROR);
    }

    if(result){
        res.render("secrets");
    }else{
        res.send("Username or password does not match.")
    }
});




app.post("/register", async function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });

    try{
        await newUser.save();
    }catch(err){
        console.log("Error adding new user.\n"+ err);
        return res.sendStatus(HTTP_SERVER_ERROR);
    }
    res.render("secrets");
});


app.post("/submit", async function(req, res){

});




app.listen(APP_PORT, function(err){
    if(err) console.log(err);

    console.log("Server listening on port: "+ APP_PORT);
});
