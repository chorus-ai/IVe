const crypto = require("crypto");
const axios = require("axios");
const FormData = require("form-data");
const userService = require("../services/user");
const featureService = require("../services/feature");
const authService = require("../services/auth");
const logService = require("../services/log");

const NODE_ENV = process.env.NODE_ENV || "development";

/**
 * Set an httpOnly cookie with the JWT token.
 */
function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

/**
 * Build the featureUsers map and enrich with app names.
 * Shared by login, signup, github-login, and impersonate.
 */
async function buildFeatureUsers(userObj) {
  userObj.featureUsers = userObj.featureUsers
    .map((f) => f.get({ plain: true }))
    .reduce((r, a) => {
      r[a.featureId] = r[a.featureId] || {};
      r[a.featureId]["role"] = a.role;
      return r;
    }, {});

  const featureIds = Object.keys(userObj.featureUsers).map(Number);
  if (featureIds.length > 0) {
    const features = await featureService.findByIds(featureIds);
    for (const feature of features) {
      const featureObj = feature.get({ plain: true });
      userObj.featureUsers[featureObj.id.toString()]["app"] = featureObj.name;
    }
  }

  return userObj;
}

exports.signup = async (req, res) => {
  const { firstName, lastName, username, email, password, loginType = 'local', isBot = 0 } = req.body;

  if (!firstName || !lastName || !username || !email || !password) {
    return res.status(400).send({ message: "firstName, lastName, username, email, and password are required." });
  }

  try {
    const existingUser = await userService.findByUsername(username);
    if (existingUser) {
      return res.status(409).send({ message: "User already exists!" });
    }

    const encryptedPassword = await authService.getEncryptedPassword(password);
    const user = await userService.create(username, email, encryptedPassword, firstName, lastName, loginType, isBot);
    const userObj = user.dataValues;
    delete userObj.password;
    const token = authService.generateToken(userObj);
    setAuthCookie(res, token);
    res.send({ message: "success", user: userObj });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username) {
    return res.status(403).send({ message: "Username cannot be empty." });
  }

  try {
    const user = await userService.findByUsername(username);
    if (!user || !user.dataValues) {
      return res.status(404).send({ message: `${username} not found` });
    }

    const userObj = user.dataValues;

    // Check for old password format (non-bcrypt hash or missing password)
    if (authService.isOldPasswordFormat(userObj.password)) {
      return res.status(200).send({
        oldPassword: true,
        message: "Your password needs to be reset. Please reset your password to continue.",
      });
    }

    // Verify password with bcrypt
    const isPasswordMatch = await authService.isValidPassword(password, userObj.password);
    delete userObj.password;
    if (!isPasswordMatch) {
      return res.status(401).send({ message: "Incorrect password!" });
    }

    // Force password reset if user has never reset since the auth overhaul
    if (!userObj.passwordResetAt) {
      return res.status(200).send({
        oldPassword: true,
        message: "Password reset required. Please set a new password to continue.",
      });
    }

    await buildFeatureUsers(userObj);
    await logService.create(userObj.id, 'Login', 'System');

    const token = authService.generateToken(userObj);
    setAuthCookie(res, token);
    res.send({ user: userObj });

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ message: "Username and password are required." });
  }

  try {
    const user = await userService.findByUsername(username);
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    const encryptedPassword = await authService.getEncryptedPassword(password);
    await userService.update(user.dataValues.id, {
      password: encryptedPassword,
      passwordResetAt: new Date(),
    });

    res.send({ message: "Password reset successfully." });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.generateApiToken = async (req, res) => {
  try {
    const token = crypto.randomBytes(32).toString("hex");
    await userService.update(req.user.id, { token, tokenResetAt: new Date() });
    res.send({ token });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.revokeApiToken = async (req, res) => {
  try {
    await userService.update(req.user.id, { token: null });
    res.send({ message: "Token revoked." });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.loginByGithub = (req, res) => {
  const { code } = req.body;
  const data = new FormData();
  data.append("client_id", process.env.GITHUB_CLIENT_ID);
  data.append("client_secret", process.env.GITHUB_CLIENT_SECRET);
  data.append("code", code);

  let userObj;

  axios.post(`https://github.com/login/oauth/access_token`, data, {
    headers: data.getHeaders(),
  })
    .then((response) => {
      const params = new URLSearchParams(response.data);
      const access_token = params.get("access_token");

      return axios.get(`https://api.github.com/user`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      });
    })
    .then((response) => userService.findByUsername(response.data.login))
    .then(async (user) => {
      if (user && user.dataValues) {
        userObj = user.dataValues;
        delete userObj.password;
        await buildFeatureUsers(userObj);
        const token = authService.generateToken(userObj);
        setAuthCookie(res, token);
        res.send({ user: userObj });
      } else {
        res.status(404).send({ message: `GitHub user not found` });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.impersonate = async (req, res) => {
  const { userId } = req.body;
  const callerId = req.user.id;

  try {
    // Check that the caller is an admin in at least one feature
    const callerFeatureUsers = req.user.featureUsers || {};
    const isAdmin = Object.values(callerFeatureUsers).some(
      (f) => f.role === "admin"
    );

    if (!isAdmin) {
      return res.status(403).send({ message: "Admin access required for impersonation" });
    }

    const targetUser = await userService.findById(userId);
    if (!targetUser || !targetUser.dataValues) {
      return res.status(404).send({ message: "Target user not found" });
    }

    const targetObj = targetUser.dataValues;
    await buildFeatureUsers(targetObj);

    await logService.create(callerId, `Impersonate user ${targetObj.username}`, 'System');

    const token = authService.generateToken(targetObj);
    setAuthCookie(res, token);
    res.send({ user: targetObj, impersonating: true });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);
    if (!user || !user.dataValues) {
      return res.status(401).send({ message: "User not found" });
    }

    const userObj = user.dataValues;
    await buildFeatureUsers(userObj);

    res.send({ user: userObj });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.logout = (_req, res) => {
  res.clearCookie("token");
  res.send({ message: "ok" });
};

// ---------- Azure AD (Entra ID) OIDC code flow ----------

const AZURE_SCOPES = ["openid", "profile", "email"];

let _msal;
function msalClient() {
  if (_msal) return _msal;
  const { ConfidentialClientApplication } = require("@azure/msal-node");
  _msal = new ConfidentialClientApplication({
    auth: {
      clientId: process.env.AZURE_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
    },
  });
  return _msal;
}

function azureRedirectUri(req) {
  return process.env.AZURE_REDIRECT_URI
    || `${req.protocol}://${req.get("host")}/api/auth/azure-callback`;
}

exports.azureLogin = async (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString("hex");
    res.cookie("azureOauthState", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: NODE_ENV === "production",
      maxAge: 10 * 60 * 1000,
    });
    const url = await msalClient().getAuthCodeUrl({
      scopes: AZURE_SCOPES,
      redirectUri: azureRedirectUri(req),
      state,
    });
    res.redirect(url);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.azureCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.redirect("/signin?error=azure_no_code");
    if (!state || state !== req.cookies.azureOauthState) {
      return res.redirect("/signin?error=azure_state_mismatch");
    }
    res.clearCookie("azureOauthState");

    const result = await msalClient().acquireTokenByCode({
      code,
      scopes: AZURE_SCOPES,
      redirectUri: azureRedirectUri(req),
    });

    const claims = result.idTokenClaims || {};
    const email = claims.preferred_username || claims.upn || claims.email;
    if (!email) return res.redirect("/signin?error=azure_no_email");

    const user = await userService.findByUsername(email);
    if (!user || !user.dataValues) {
      return res.redirect(`/signin?error=user_not_found&email=${encodeURIComponent(email)}`);
    }

    const userObj = user.dataValues;
    delete userObj.password;
    await buildFeatureUsers(userObj);
    await logService.create(userObj.id, "Login (Azure)", "System");

    const token = authService.generateToken(userObj);
    setAuthCookie(res, token);

    const firstApp = Object.values(userObj.featureUsers || {})[0]?.app;
    res.redirect(firstApp ? `/${firstApp}` : "/features");
  } catch (err) {
    res.redirect(`/signin?error=${encodeURIComponent("azure_callback: " + err.message)}`);
  }
};
