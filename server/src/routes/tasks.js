const express = require("express");
const router = express.Router();
const passport = require("passport");

require("../config/passport")(passport);
const Task = require("../models/Task");

// Create a task
router.post(
  "/tasks",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    var token = getToken(req.headers);
    if (token) {
      const { description } = req.body;
      const user = req.user;
      const task = new Task({ description, user });
      try {
        task.save();
        return res.status(200).json({ success: true, msg: "Task Created" });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ success: true, msg: "Server error" });
      }
    } else {
      return res.status(403).send({ success: false, msg: "Unauthorized." });
    }
  }
);

// Get all of the tasks form a particular user
router.get(
  "/tasks",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    var token = getToken(req.headers);
    if (token) {
      Task.find({ user: req.user }, function (err, tasks) {
        if (err) return next(err);
        return res.status(200).json(tasks);
      });
    } else {
      return res.status(403).send({ success: false, msg: "Unauthorized." });
    }
  }
);

// Change task description
router.patch(
  "/tasks/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let task;
    try {
      task = await Task.findById(req.params.id);
      if (task == null) {
        return res.status(404).json({ message: "Cannot find task" });
      }
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }

    if (req.body.description != null) {
      task.description = req.body.description;
    }

    try {
      const updatedTask = await task.save();
      return res.json(updatedTask);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }
);

// Delete a task
router.delete(
  "/tasks/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let task;
    try {
      task = await Task.findById(req.params.id);
      if (task == null) {
        return res.status(404).json({ message: "Cannot find task" });
      }
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }

    try {
      await task.remove();
      return res.status(200).json({ message: 'Deleted task' });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }
);

getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(" ");
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

module.exports = router;
