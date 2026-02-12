const User = require("../models/User");
const { isValidObjectId, Types } = require("mongoose");

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function mapUser(userDoc) {
  if (!userDoc) {
    return null;
  }

  return {
    id: userDoc._id.toString(),
    email: userDoc.email,
    passwordHash: userDoc.passwordHash,
    createdAt: userDoc.createdAt
  };
}

async function createUser({ email, passwordHash }) {
  const normalizedEmail = normalizeEmail(email);
  const created = await User.create({
    email: normalizedEmail,
    passwordHash
  });

  return mapUser(created);
}

async function findById(id) {
  if (!isValidObjectId(id)) {
    return null;
  }

  const user = await User.findById(id).lean();
  return mapUser(user);
}

async function findByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).lean();
  return mapUser(user);
}

async function listUsers() {
  return findUsers({
    projection: { email: 1, createdAt: 1, _id: 1 },
    sort: { createdAt: -1 }
  });
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeDocument(document) {
  if (!isPlainObject(document)) {
    return document;
  }

  if (!document._id) {
    return document;
  }

  const normalized = { ...document };
  normalized.id = String(normalized._id);
  delete normalized._id;
  return normalized;
}

function normalizeInsertDocument(document) {
  const normalized = { ...document };
  const now = new Date();

  if (normalized.id && !normalized._id) {
    normalized._id = normalized.id;
  }

  if (typeof normalized._id === "string" && isValidObjectId(normalized._id)) {
    normalized._id = new Types.ObjectId(normalized._id);
  }

  delete normalized.id;

  if (!normalized.createdAt) {
    normalized.createdAt = now;
  }

  if (!normalized.updatedAt) {
    normalized.updatedAt = now;
  }

  return normalized;
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

function normalizeUpdatePayload(update) {
  if (!isPlainObject(update)) {
    return update;
  }

  const normalized = { ...update };

  if (isPlainObject(normalized.$set)) {
    normalized.$set = {
      ...normalized.$set,
      updatedAt: normalized.$set.updatedAt || new Date()
    };
    return normalized;
  }

  return {
    ...normalized,
    $set: {
      ...(isPlainObject(normalized.$set) ? normalized.$set : {}),
      updatedAt: new Date()
    }
  };
}

async function findUsers({ filter = {}, projection = {}, sort = { createdAt: -1 }, limit = 50, skip = 0 } = {}) {
  const options = {};

  if (isPlainObject(projection) && Object.keys(projection).length > 0) {
    options.projection = projection;
  }

  const cursor = User.collection.find(normalizeFilter(filter), options);

  if (isPlainObject(sort) && Object.keys(sort).length > 0) {
    cursor.sort(sort);
  }

  if (Number.isInteger(skip) && skip > 0) {
    cursor.skip(skip);
  }

  if (Number.isInteger(limit) && limit > 0) {
    cursor.limit(limit);
  }

  const users = await cursor.toArray();
  return users.map(normalizeDocument);
}

async function insertOneUser(document) {
  const result = await User.collection.insertOne(normalizeInsertDocument(document));
  return result;
}

async function insertManyUsers(documents) {
  const preparedDocuments = documents.map((document) => normalizeInsertDocument(document));
  const result = await User.collection.insertMany(preparedDocuments);
  return result;
}

async function updateOneUser({ filter, update, options = {} }) {
  const result = await User.collection.updateOne(
    normalizeFilter(filter),
    normalizeUpdatePayload(update),
    options
  );
  return result;
}

async function updateManyUsers({ filter, update, options = {} }) {
  const result = await User.collection.updateMany(
    normalizeFilter(filter),
    normalizeUpdatePayload(update),
    options
  );
  return result;
}

async function replaceOneUser({ filter, replacement, options = {} }) {
  const normalizedReplacement = normalizeInsertDocument(replacement);
  const result = await User.collection.replaceOne(normalizeFilter(filter), normalizedReplacement, options);
  return result;
}

async function deleteOneUser(filter) {
  const result = await User.collection.deleteOne(normalizeFilter(filter));
  return result;
}

async function deleteManyUsers(filter) {
  const result = await User.collection.deleteMany(normalizeFilter(filter));
  return result;
}

module.exports = {
  createUser,
  findById,
  findByEmail,
  listUsers,
  findUsers,
  insertOneUser,
  insertManyUsers,
  updateOneUser,
  updateManyUsers,
  replaceOneUser,
  deleteOneUser,
  deleteManyUsers
};
