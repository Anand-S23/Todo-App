const express = require("express");
const router = express.Router();
const argon2 = require("argon2");
const passport = require("passport");
var jwt = require('jsonwebtoken');

var config = require('../config/database');
require('../config/passport')(passport);
const User = require("../models/User");

// Register
router.post("/register", async (req, res) => {
  const { username, email, password, password2 } = req.body;
  let errors = [];

  if (!username || !email || !password || !password2) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (password != password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  if (errors.length > 0) {
    return res.status(400).json({
        errors: errors
    });
  } else {
    User.findOne({ email: email }).then((user) => {
      if (user) {
        return res.status(400).json({
            msg: "User with this email already exists"
        });
      } 
    });
    
    User.findOne({ username: username }).then((user) => {
      if (user) {
        return res.status(400).json({
            msg: "User with this username already exists"
        });
      } 
    });

    try {
      user = new User({ username, email, password });
      user.password = await argon2.hash(password);
      user.save();

      return res.status(200).json({
          msg: "Account created successfully"
      });
    }
    catch (err) {
      console.error(err);
      return res.status(500).json({
          msg: "Error in saving user"
      });
    }
  }
});

// Login
router.post("/login", async (req, res, next) => {
    const { username, password } = req.body;


    User.findOne({ username: username }, async (err, user) => {
        if (err) throw err;

        if (!user) {
            res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
        } else {
            // check if password matches
            try {
                isMatch = await argon2.verify(user.password, password);
                if (isMatch) {
                    // if user is found and password is right create a token
                    var token = jwt.sign(user.toJSON(), config.secret, {
                        expiresIn: 604800 // 1 week
                    });

                    // return the information including token as JSON
                    return res.status(200).json({success: true, token: 'JWT ' + token});
                } else {
                    return res.status(401).send({
                        success: false, 
                        msg: 'Authentication failed. Wrong password.'
                    });
                }
            }
            catch (err) {
                return res.status(500).json({ msg: 'Server error' });
            }
        }
    });
});

// Logout
router.get('/logout', passport.authenticate('jwt', { session: false}), function(req, res) {
  req.session.destroy();
  return res.status(200).json({
      success: true, 
      msg: 'Sign out successfully.'
    });
});

module.exports = router;
