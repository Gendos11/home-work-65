const { Router } = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { createUser, findByEmail } = require("../data/userStore");

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long."
      });
    }

    const existingUser = await findByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        message: "User with this email already exists."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({ email, passwordHash });

    req.login(user, (loginError) => {
      if (loginError) {
        return res.status(500).json({ message: "Registration succeeded, but login failed." });
      }

      return res.status(201).json({
        message: "Registration successful.",
        user: {
          id: user.id,
          email: user.email
        }
      });
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "User with this email already exists."
      });
    }

    return res.status(500).json({
      message: "Registration failed.",
      error: error.message
    });
  }
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (error, user, info) => {
    if (error) {
      return res.status(500).json({
        message: "Login failed.",
        error: error.message
      });
    }

    if (!user) {
      return res.status(401).json({
        message: info?.message || "Invalid credentials."
      });
    }

    req.login(user, (loginError) => {
      if (loginError) {
        return res.status(500).json({
          message: "Login failed.",
          error: loginError.message
        });
      }

      return res.status(200).json({
        message: "Login successful.",
        user: {
          id: user.id,
          email: user.email
        }
      });
    });
  })(req, res, next);
});

router.post("/logout", (req, res) => {
  req.logout((logoutError) => {
    if (logoutError) {
      return res.status(500).json({
        message: "Logout failed.",
        error: logoutError.message
      });
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        return res.status(500).json({
          message: "Logged out, but failed to clear session.",
          error: sessionError.message
        });
      }

      res.clearCookie("connect.sid");
      return res.status(200).json({
        message: "Logout successful."
      });
    });
  });
});

router.get("/me", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      message: "Not authenticated."
    });
  }

  return res.status(200).json({
    user: {
      id: req.user.id,
      email: req.user.email
    }
  });
});

module.exports = router;
