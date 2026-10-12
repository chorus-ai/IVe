const express = require("express");
const router = express.Router();
const authHandler = require("../handler/auth");
const authMiddleware = require("../middleware/auth");

// Get user by local auth
router.post("/login", authHandler.login);
// Get user by github auth
router.post("/github-login", authHandler.loginByGithub);
// Azure AD (Entra ID) OIDC — browser redirect flow
router.get("/azure-login", authHandler.azureLogin);
router.get("/azure-callback", authHandler.azureCallback);
// Sign up
router.post("/signup", authHandler.signup);
// Admin impersonation (requires auth)
router.post("/impersonate", authMiddleware, authHandler.impersonate);
// Restore session from cookie
router.get("/me", authMiddleware, authHandler.me);
// Reset password (public)
router.post("/resetPassword", authHandler.resetPassword);
// API token management (requires auth)
router.post("/token/generate", authMiddleware, authHandler.generateApiToken);
router.post("/token/revoke", authMiddleware, authHandler.revokeApiToken);
// Clear auth cookie
router.post("/logout", authHandler.logout);

module.exports = router;
