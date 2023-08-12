//jshint esversion:6

// Version 3
// Use bcrypt to salt and hash passwords when storing then in database
//

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

const saltRounds =10;

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
    let match = undefined;
    try{
        result = await User.findOne({
            email: req.body.username,
        });

        match = bcrypt.compare(req.body.password, result.password);

    }catch(err){
        console.log("Error finding user.\n"+ err);
        return res.send("Error finding user.");
    }

    if(match){
        res.render("secrets");
    }else{
        res.send("Username or password does not match.")
    }
});




app.post("/register", async function(req, res){

    let hash = undefined;

    try{
        hash = await bcrypt.hash(req.body.password, saltRounds);

        const newUser = new User({
            email: req.body.username,
            password: hash
        });

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
