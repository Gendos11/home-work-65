const { Router } = require("express");
const { isValidObjectId, Types } = require("mongoose");
const requireAuth = require("../middleware/requireAuth");
const {
  findUsers,
  insertOneUser,
  insertManyUsers,
  updateOneUser,
  updateManyUsers,
  replaceOneUser,
  deleteOneUser,
  deleteManyUsers
} = require("../data/userStore");

const router = Router();

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function tryParseJsonObject(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return {
      ok: true,
      value: {}
    };
  }

  try {
    const parsed = JSON.parse(value);

    if (!isPlainObject(parsed)) {
      return {
        ok: false,
        message: `${fieldName} must be a JSON object.`
      };
    }

    return {
      ok: true,
      value: parsed
    };
  } catch (error) {
    return {
      ok: false,
      message: `Invalid ${fieldName} JSON. ${error.message}`
    };
  }
}

function normalizeFilter(filter) {
  if (!isPlainObject(filter)) {
    return {};
  }

  const normalized = { ...filter };

  if (normalized.id && !normalized._id) {
    normalized._id = normalized.id;
  }

  if (typeof normalized._id === "string" && isValidObjectId(normalized._id)) {
    normalized._id = new Types.ObjectId(normalized._id);
  }

  delete normalized.id;
  return normalized;
}

function parseIntegerValue(value, fallback, maxValue) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number.parseInt(String(value), 10);

  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }

  return Math.min(parsed, maxValue);
}

router.get("/", requireAuth, async (req, res) => {
  const parsedFilter = tryParseJsonObject(req.query.filter, "filter");
  if (!parsedFilter.ok) {
    return res.status(400).json({ message: parsedFilter.message });
  }

  const parsedProjection = tryParseJsonObject(req.query.projection, "projection");
  if (!parsedProjection.ok) {
    return res.status(400).json({ message: parsedProjection.message });
  }

  const parsedSort = tryParseJsonObject(req.query.sort, "sort");
  if (!parsedSort.ok) {
    return res.status(400).json({ message: parsedSort.message });
  }

  const limit = parseIntegerValue(req.query.limit, 50, 100);
  const skip = parseIntegerValue(req.query.skip, 0, 10000);

  if (limit === null || skip === null) {
    return res.status(400).json({
      message: "Query params limit and skip must be non-negative integers."
    });
  }

  try {
    const projection =
      Object.keys(parsedProjection.value).length > 0 ? parsedProjection.value : { passwordHash: 0 };
    const sort = Object.keys(parsedSort.value).length > 0 ? parsedSort.value : { createdAt: -1 };

    const users = await findUsers({
      filter: normalizeFilter(parsedFilter.value),
      projection,
      sort,
      limit,
      skip
    });

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

router.post("/insert-one", requireAuth, async (req, res) => {
  const { document } = req.body;

  if (!isPlainObject(document)) {
    return res.status(400).json({
      message: "document is required and must be an object."
    });
  }

  try {
    const result = await insertOneUser(document);

    return res.status(201).json({
      message: "insertOne completed.",
      acknowledged: result.acknowledged,
      insertedId: String(result.insertedId)
    });
  } catch (error) {
    return res.status(500).json({
      message: "insertOne failed.",
      error: error.message
    });
  }
});

router.post("/insert-many", requireAuth, async (req, res) => {
  const { documents } = req.body;

  if (!Array.isArray(documents) || documents.length === 0) {
    return res.status(400).json({
      message: "documents is required and must be a non-empty array."
    });
  }

  const invalidDocument = documents.find((document) => !isPlainObject(document));

  if (invalidDocument) {
    return res.status(400).json({
      message: "Every element in documents must be an object."
    });
  }

  try {
    const result = await insertManyUsers(documents);

    return res.status(201).json({
      message: "insertMany completed.",
      acknowledged: result.acknowledged,
      insertedCount: result.insertedCount,
      insertedIds: Object.values(result.insertedIds).map((id) => String(id))
    });
  } catch (error) {
    return res.status(500).json({
      message: "insertMany failed.",
      error: error.message
    });
  }
});

router.patch("/update-one", requireAuth, async (req, res) => {
  const { filter, update, upsert = false } = req.body;

  if (!isPlainObject(filter) || !isPlainObject(update)) {
    return res.status(400).json({
      message: "filter and update are required and must be objects."
    });
  }

  try {
    const result = await updateOneUser({
      filter: normalizeFilter(filter),
      update,
      options: { upsert: Boolean(upsert) }
    });

    return res.status(200).json({
      message: "updateOne completed.",
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId ? String(result.upsertedId) : null
    });
  } catch (error) {
    return res.status(500).json({
      message: "updateOne failed.",
      error: error.message
    });
  }
});

router.patch("/update-many", requireAuth, async (req, res) => {
  const { filter, update, upsert = false } = req.body;

  if (!isPlainObject(filter) || !isPlainObject(update)) {
    return res.status(400).json({
      message: "filter and update are required and must be objects."
    });
  }

  try {
    const result = await updateManyUsers({
      filter: normalizeFilter(filter),
      update,
      options: { upsert: Boolean(upsert) }
    });

    return res.status(200).json({
      message: "updateMany completed.",
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId ? String(result.upsertedId) : null
    });
  } catch (error) {
    return res.status(500).json({
      message: "updateMany failed.",
      error: error.message
    });
  }
});

router.put("/replace-one", requireAuth, async (req, res) => {
  const { filter, replacement, upsert = false } = req.body;

  if (!isPlainObject(filter) || !isPlainObject(replacement)) {
    return res.status(400).json({
      message: "filter and replacement are required and must be objects."
    });
  }

  try {
    const result = await replaceOneUser({
      filter: normalizeFilter(filter),
      replacement,
      options: { upsert: Boolean(upsert) }
    });

    return res.status(200).json({
      message: "replaceOne completed.",
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId ? String(result.upsertedId) : null
    });
  } catch (error) {
    return res.status(500).json({
      message: "replaceOne failed.",
      error: error.message
    });
  }
});

router.delete("/delete-one", requireAuth, async (req, res) => {
  const { filter } = req.body;

  if (!isPlainObject(filter)) {
    return res.status(400).json({
      message: "filter is required and must be an object."
    });
  }

  try {
    const result = await deleteOneUser(normalizeFilter(filter));

    return res.status(200).json({
      message: "deleteOne completed.",
      acknowledged: result.acknowledged,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    return res.status(500).json({
      message: "deleteOne failed.",
      error: error.message
    });
  }
});

router.delete("/delete-many", requireAuth, async (req, res) => {
  const { filter } = req.body;

  if (!isPlainObject(filter)) {
    return res.status(400).json({
      message: "filter is required and must be an object."
    });
  }

  try {
    const result = await deleteManyUsers(normalizeFilter(filter));

    return res.status(200).json({
      message: "deleteMany completed.",
      acknowledged: result.acknowledged,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    return res.status(500).json({
      message: "deleteMany failed.",
      error: error.message
    });
  }
});

router.get("/page", requireAuth, async (req, res) => {
  try {
    const users = await findUsers({
      projection: { email: 1, createdAt: 1, _id: 1 },
      sort: { createdAt: -1 },
      limit: 100
    });
    const usersListMarkup =
      users.length === 0
        ? "<p>No users found in MongoDB yet.</p>"
        : `<ul>${users
            .map(
              (user) =>
                `<li><strong>${escapeHtml(user.email || "n/a")}</strong> - ${user.createdAt ? new Date(user.createdAt).toLocaleString("uk-UA") : "n/a"}</li>`
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
