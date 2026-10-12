const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "hulab-dev-secret-change-in-production";

exports.getEncryptedPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);
  return hashPassword;
};

exports.isValidPassword = (pwd, hash) => {
  return bcrypt.compare(pwd, hash);
};

exports.generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      featureUsers: user.featureUsers,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

exports.verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

exports.isOldPasswordFormat = (hash) => {
  // bcrypt hashes always start with $2a$, $2b$, or $2y$ and are 60 chars
  if (!hash) return true;
  return !hash.startsWith("$2") || hash.length !== 60;
};
