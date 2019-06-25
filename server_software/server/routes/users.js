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
  User.findOne({email: query.email}).then(user => {
    if (user) {
      return res.status(400).json({email: "Email already exists"});
    } else {
      const newUser = new User({
        name: query.name,
        email: query.email,
        password: query.password
      });
// Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json({name: user.name,email: user.email}))
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
  const email = query.email;
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
          name: user.name
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
      } else {
        return res
          .status(400)
          .json({password: "Password incorrect"});
      }
    });
  });
});
module.exports = router;