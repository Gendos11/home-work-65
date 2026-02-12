const { Router } = require("express");
const requireAuth = require("../middleware/requireAuth");

const router = Router();

router.get("/", requireAuth, (req, res) => {
  return res.status(200).json({
    message: "You have access to protected data.",
    user: {
      id: req.user.id,
      email: req.user.email
    }
  });
});

module.exports = router;
