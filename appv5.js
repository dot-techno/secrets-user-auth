//jshint esversion:6

// Version 5
// Use Open Authentication (oauth)
//

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import {Strategy as GoogleStrategy} from "passport-google-oauth20";
import findOrCreate from "mongoose-findorcreate";

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
    password: String,
    googleId: String,
    secrets: [String]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());
// use functions from passportLocalMongoose to serialize and deserialize 
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});

passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});



passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// this route is called by button on register page
// we need to send user to google auth
app.get("/auth/google",
    passport.authenticate("google", {scope: ["profile"]}));


// This route is calleed by google after user authenticates with google
app.get("/auth/google/secrets", 
    passport.authenticate('google', {failureRedirect: "/login"}),
    function(req, res){
        res.redirect("/secrets");
    
});

app.get("/", function(req, res){
    res.render("home");

});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", async function(req, res){
    res.render("register");
});

app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else {
        res.redirect("/login")
    }
});

app.get("/secrets", async function(req, res, next){
    let users_with_secrets = undefined;
    let secrets = [];

    try{
        users_with_secrets = await User.find({"secrets": {$ne: null}});
        console.log(users_with_secrets.length);
        users_with_secrets.forEach(function(user){
            secrets = secrets.concat(user.secrets);
        });
        res.render("secrets", {secrets: secrets} );
    }catch(err){
        console.log(err.message);
        next(err);
    }

    // if (req.isAuthenticated()){
    //     res.render("secrets");
    // }else {
    //     console.log(req.isAuthenticated());
    //     res.redirect("/login");
    // }
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


app.post("/submit", async function(req, res, next){
    let usr = undefined;
    try{
        usr = await User.findById(req.user.id);
        usr.secrets.push(req.body.secret); 
        await usr.save();
        return res.redirect("/secrets");
    }catch(err){
        console.log(err.message);
        next(err);
    }

});




app.listen(APP_PORT, function(err){
    if(err) console.log(err);

    console.log("Server listening on port: "+ APP_PORT);
});
