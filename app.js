const express = require("express");
const app = express();
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const { Admin, Election, Questions, Options, Voter } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const flash = require("connect-flash");
const LocalStratergy = require("passport-local");

const saltRounds = 10;
app.set("views", path.join(__dirname, "views"));
app.use(flash());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("Some secret String"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(
    session({
      secret: "my-super-secret-key-2837428907583420",
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );
  app.use((request, response, next) => {
    response.locals.messages = request.flash();
    next();
  });
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(
    new LocalStratergy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      (username, password, done) => {
        Admin.findOne({ where: { email: username } })
          .then(async (user) => {
            const result = await bcrypt.compare(password, user.password);
            if (result) {
              return done(null, user);
            } else {
              return done(null, false, { message: "Invalid password" });
            }
          })
          .catch(() => {
            return done(null, false, { message: "Invalid Email-ID" });
          });
      }
    )
  );
  
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser((id, done) => {
    Admin.findByPk(id)
      .then((user) => {
        done(null, user);
      })
      .catch((error) => {
        done(error, null);
      });
  });
  
  app.set("view engine", "ejs");
  app.use(express.static(path.join(__dirname, "public")));
  
  //Landing page
  app.get("/", (request, response) => {
    if (request.user) {
      return response.redirect("/elections");
    } else {
      response.render("index", {
        title: "Online Voting Platform",
        csrfToken: request.csrfToken(),
      });
    }
  });
  
  //Home Page for Elections
  app.get(
    "/elections",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      let loggedinuser = request.user.firstName + " " + request.user.lastName;
      try {
        const elections = await Election.getElections(request.user.id);
        if (request.accepts("html")) {
          response.render("elections", {
            title: "Online Voting Platform",
            userName: loggedinuser,
            elections,
          });
        } else {
          return response.json({
            elections,
          });
        }
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    }
  );
  
  //signup page
  app.get("/signup", (request, response) => {
    response.render("signup", {
      title: "Create admin account",
      csrfToken: request.csrfToken(),
    });
  });
  
  //create admin account
  app.post("/admin", async (request, response) => {
    if (!request.body.firstName) {
      request.flash("error", "Please enter your first name");
      return response.redirect("/signup");
    }
    if (!request.body.email) {
      request.flash("error", "Please enter email ID");
      return response.redirect("/signup");
    }
    if (!request.body.password) {
      request.flash("error", "Please enter your password");
      return response.redirect("/signup");
    }
    if (request.body.password < 8) {
      request.flash("error", "Password length should be atleast 8");
      return response.redirect("/signup");
    }
    const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
    try {
      const user = await Admin.createAdmin({
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        email: request.body.email,
        password: hashedPwd,
      });
      request.login(user, (err) => {
        if (err) {
          console.log(err);
          response.redirect("/");
        } else {
          response.redirect("/elections");
        }
      });
    } catch (error) {
      request.flash("error", error.message);
      return response.redirect("/signup");
    }
  });