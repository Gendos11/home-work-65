const User = require("../models/User");
const { isValidObjectId } = require("mongoose");

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
  const users = await User.find({}, { email: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .lean();

  return users.map((userDoc) => ({
    id: userDoc._id.toString(),
    email: userDoc.email,
    createdAt: userDoc.createdAt
  }));
}

module.exports = {
  createUser,
  findById,
  findByEmail,
  listUsers
};
