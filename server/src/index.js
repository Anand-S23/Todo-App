const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 5000;

// Passport Config
require("./config/passport")(passport);

const db = require("./config/database").mongoURI;

mongoose
  .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Express session
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());

// Routes
app.use("/api", require("./routes/users"));
app.use("/api", passport.authenticate('jwt', { session: false}), require("./routes/tasks"));

app.listen(PORT, (req, res) => {
  console.log(`Server running on port ${ PORT }...`);
});
