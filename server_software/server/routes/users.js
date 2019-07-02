const passport = require('passport');

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../keys");

// Load input validation
const validateRegistrationInput = require("../validation/register");
const validateLoginInput = require("../validation/login");
// Load User model
const User = require("../models/User");

const {routeBuffer, userCache} = require('../passport-config');//authenticate specific routes

// @route POST api/users/register
// @desc Register user
// @access Public
router.post("/register", (req, res) => {
  // Form validation
  const query = req.body;
  const {errors, isValid} = validateRegistrationInput(query);

// Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  User.findOne({email: query.email.toLowerCase()}).then(user => {
    if (user) {
      return res.status(400).json({email: "Email already exists"});
    } else {
      const newUser = new User({
        name: query.name,
        email: query.email.toLowerCase(),
        password: query.password
      });
// Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json({name: user.name, email: user.email.toLowerCase()}))
            .catch(err => console.log(err));
        });
      });
    }
  });
});

// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public
router.post("/login", (req, res) => {
  // Form validation
  const query = req.body;
  const {errors, isValid} = validateLoginInput(query);
// Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const email = query.email.toLowerCase();
  const password = query.password;
// Find user by email
  User.findOne({email}).then(user => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({email: "Email not found"});
    }
// Check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        const payload = {
          id: user.id,
          name: user.name,
        };
// Sign token
        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: 24*60*60// 24 hours
          },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token
            });
          }
        );
        user.lastLogin = Date.now();

        user.save(err => {//better way instead of making two requests? Like returning within this current method?
          if (err) {
            console.log(`Failed to update user ${user.email} last login: `);
            console.log(err);
          }
        });
        userCache.remove(user.id);//make sure the user is refreshed from security once logged in
      } else {
        return res
          .status(400)
          .json({password: "Password incorrect"});
      }
    });
  });
});

router.use('/edit', (req, res, next) => {
  routeBuffer.push("EDIT_USERS");
  next();
});
router.use('/edit', passport.authenticate('jwt', {session: false}));
router.get("/edit/list", (req, res) => {
  User.find({}, (err, users) => {
    users.map(user => {
      user.password = undefined;//the client doesnt need this
      return user;
    });
    res.send(users);
  });

});
module.exports = router;
