// Imports
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
User = require("./models/user");
const mongoose = require("mongoose");
var passport = require("passport"),
  LocalStrategy = require("passport-local");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var flash = require("connect-flash");
// Process setup
require("dotenv/config");

//////////////
// Database //
//////////////

mongoose
  .connect(
    "mongodb+srv://hriday:hriday123@cluster0-tjunm.mongodb.net/hriday?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connected to db!"));

const Registration = mongoose.model("details", {
  first_name: String,
  last_name: String,
  email: String,
  area_code: String,
  phone: String,
  subject: String,
  tickets: Number,
});

/////////////////
// Express App //
/////////////////

const app = express();
app.set("view engine", "ejs");

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

// Static
app.use(express.static("public"));

//PASSPORT CONFIGURATION
app.use(
  require("express-session")({
    secret: "Eunoia Eunoia EUnoia",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  next();
});
////////////
// Routes //
////////////

// Home

app.get("/", (req, res) => {
  res.render("homepage", { currentUser: req.user });
});
//events
app.get("/events", (req, res) => {
  res.render("events");
});
// Snaps of flight
app.get("/snapsoflight", (req, res) => {
  res.render("snapsoflight");
});

//ARIJIT
app.get("/arijit", (req, res) => {
  res.render("arijit");
});

//ART
app.get("/art", isLoggedIn, (req, res) => {
  res.render("art");
});

//DOME
app.get("/dome", (req, res) => {
  res.render("dome");
});

//FOODFEST
app.get("/foodfest", (req, res) => {
  res.render("foodfest");
});

//HALLOWEEN
app.get("/halloween", (req, res) => {
  res.render("halloween");
});

//FAQ
app.get("/faq", (req, res) => {
  res.render("faq");
});

//INFO
app.get("/info", (req, res) => {
  res.render("info");
});

//NEWS
app.get("/news", (req, res) => {
  res.render("news");
});

//STAGES
app.get("/stages", (req, res) => {
  res.render("stages");
});

//SUCCESS
app.get("/success", isLoggedIn, (req, res) => {
  res.render("success");
});

// Form
app.get("/forms", isLoggedIn, (req, res) => {
  res.render("forms");
});

app.post("/forms", isLoggedIn, (req, res) => {
  const data = req.body;

  Registration.create(data).then((document) => {
    res.redirect("/preview/" + document.id);
  });
});

// Previews the registration which was jsut stored, by getting its ID
app.get("/preview/:id", isLoggedIn, (req, res) => {
  const id = req.params.id;

  Registration.findById(id)
    .then((document) => {
      const data = document.toObject();

      res.render("preview", data);
    })
    .catch((error) => console.log("Unkown id", id));
});

//ADDS THE REGISTRATION NUMBER TO THE PAGE:
app.get("/success/:id", isLoggedIn, (req, res) => {
  var id = req.params.id;

  Registration.findById(id)
    .then((document) => {
      const data = document.toObject();

      res.render("sucesss", { id: id });
    })
    .catch((error) => console.log("Unkown id", id));
});
//AUTHORIZATION

//register form
app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  var newUser = new User({
    username: req.body.username,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    phone: req.body.phone,
  });
  User.register(newUser, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      return res.render("register");
    }
    passport.authenticate("local")(req, res, function () {
      res.redirect("/");
    });
  });
});
//login
app.get("/login", function (req, res) {
  res.render("login");
});
// handling login logic
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  }),
  function (req, res) {}
);
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/forgot", function (req, res) {
  res.render("forgot");
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}
/////////////////////
// Start Listening //
/////////////////////

const port = process.env.PORT || 3000;
const host = process.env.HOST || "localhost";

app.listen(port, process.env.IP, function () {
  console.log("Server is listening!");
});
