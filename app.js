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
app.post("/forgot", function (req, res, next) {
  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      function (token, done) {
        User.findOne({ username: req.body.username }, function (err, user) {
          if (!user) {
            return res.redirect("/forgot");
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save(function (err) {
            done(err, token, user);
          });
        });
      },
      function (token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "eunoia.cestlavie@gmail.com",
            pass: "eunoia123",
          },
        });
        var mailOptions = {
          to: user.username,
          from: "eunoia.cestlavie@gmail.com",
          subject: " Password Reset",
          text:
            "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
            "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
            "http://" +
            req.headers.host +
            "/reset/" +
            token +
            "\n\n" +
            "If you did not request this, please ignore this email and your password will remain unchanged.\n",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          console.log("mail sent");
          done(err, "done");
        });
      },
    ],
    function (err) {
      if (err) return next(err);
      res.redirect("/forgot");
    }
  );
});

//RESET
app.get("/reset/:token", function (req, res) {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    },
    function (err, user) {
      if (!user) {
        console.log("here");
        return res.redirect("/forgot");
      }
      res.render("reset", { token: req.params.token });
    }
  );
});

app.post("/reset/:token", function (req, res) {
  async.waterfall(
    [
      function (done) {
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
          },
          function (err, user) {
            if (!user) {
              return res.redirect("back");
            }
            if (req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, function (err) {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function (err) {
                  req.logIn(user, function (err) {
                    done(err, user);
                  });
                });
              });
            } else {
              return res.redirect("back");
            }
          }
        );
      },
      function (user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "eunoia.cestlavie@gmail.com",
            pass: "eunoia123",
          },
        });
        var mailOptions = {
          to: user.username,
          from: "eunoia.cestlavie@gmail.com",
          subject: "Your password has been changed",
          text:
            "Hello,\n\n" +
            "This is a confirmation that the password for your account " +
            user.username +
            " has just been changed.\n",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          done(err);
        });
      },
    ],
    function (err) {
      res.redirect("/events");
    }
  );
});

//MIDDLEWARE2
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
