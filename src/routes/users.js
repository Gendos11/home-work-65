const { Router } = require("express");
const requireAuth = require("../middleware/requireAuth");
const { listUsers } = require("../data/userStore");

const router = Router();

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const users = await listUsers();

    return res.status(200).json({
      total: users.length,
      users
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load users from MongoDB.",
      error: error.message
    });
  }
});

router.get("/page", requireAuth, async (req, res) => {
  try {
    const users = await listUsers();
    const usersListMarkup =
      users.length === 0
        ? "<p>No users found in MongoDB yet.</p>"
        : `<ul>${users
            .map(
              (user) =>
                `<li><strong>${escapeHtml(user.email)}</strong> - ${new Date(user.createdAt).toLocaleString("uk-UA")}</li>`
            )
            .join("")}</ul>`;

    const page = `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MongoDB Users</title>
    <style>
      body { font-family: sans-serif; max-width: 720px; margin: 40px auto; padding: 0 16px; line-height: 1.5; }
      h1 { margin-bottom: 8px; }
      p { color: #333; }
    </style>
  </head>
  <body>
    <h1>Користувачі з MongoDB Atlas</h1>
    <p>Знайдено: ${users.length}</p>
    ${usersListMarkup}
  </body>
</html>`;

    return res.status(200).send(page);
  } catch (error) {
    return res.status(500).send(`<h1>Failed to load users</h1><p>${escapeHtml(error.message)}</p>`);
  }
});

module.exports = router;
