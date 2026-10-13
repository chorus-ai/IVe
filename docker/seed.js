#!/usr/bin/env node
"use strict";

// Bootstrap a fresh IVe database: the `ive` feature row plus one admin user
// who can log in straight away. Idempotent — safe to re-run; an existing user
// is granted admin, and gets a new password only if one is passed.
//
//   docker compose exec api node /srv/seed.js \
//     --username admin --email admin@example.org --password '<pw>'
//
// The password can come from IVE_ADMIN_PASSWORD instead, to keep it out of
// shell history:
//   docker compose exec -e IVE_ADMIN_PASSWORD='<pw>' api node /srv/seed.js \
//     --username admin --email admin@example.org
//
// Uses the server's own models, so it works against whatever APP_DB_* in .env
// points at (SQLite or Postgres). Synced to the IVe repo as docker/seed.js and
// baked into the api image — edit the copy in docker/ive/.

const { parseArgs } = require("node:util");

const { values: args } = parseArgs({
  options: {
    username: { type: "string" },
    email: { type: "string" },
    password: { type: "string" },
    "first-name": { type: "string", default: "IVe" },
    "last-name": { type: "string", default: "Admin" },
  },
});
const password = args.password || process.env.IVE_ADMIN_PASSWORD;

if (!args.username || !args.email) {
  console.error("usage: node /srv/seed.js --username <u> --email <e> [--password <p> | IVE_ADMIN_PASSWORD=<p>]");
  process.exit(1);
}

const db = require("/srv/server/models");
const authService = require("/srv/server/services/auth");

// Matches APP in client/src/apps/ive/hooks/useIveUsers.ts — membership is
// looked up by feature name, and role "admin" is what unlocks the admin UI.
const FEATURE_NAME = "ive";
const ADMIN_ROLE = "admin";
const ACTIVE_STATUS = "Active";

async function main() {
  db.sequelize_app.options.logging = false;
  // The api container syncs on boot, but this may run before it has.
  await db.sequelize_app.sync();

  const [feature, featureCreated] = await db.feature.findOrCreate({
    where: { name: FEATURE_NAME },
    defaults: { name: FEATURE_NAME, description: "IVe", allowSignup: false },
  });
  console.log(`feature '${FEATURE_NAME}' (id ${feature.id}) ${featureCreated ? "created" : "exists"}`);

  let user = await db.user.findOne({ where: { username: args.username } });
  if (!user) {
    if (!password) throw new Error("new user needs --password or IVE_ADMIN_PASSWORD");
    user = await db.user.create({
      username: args.username,
      email: args.email,
      password: await authService.getEncryptedPassword(password),
      firstName: args["first-name"],
      lastName: args["last-name"],
      loginType: "local",
      // Login refuses accounts that never reset their password
      // (handler/auth.js); a seeded password counts as already set.
      passwordResetAt: new Date(),
    });
    console.log(`user '${user.username}' (id ${user.id}) created`);
  } else if (password) {
    await user.update({
      password: await authService.getEncryptedPassword(password),
      passwordResetAt: new Date(),
    });
    console.log(`user '${user.username}' (id ${user.id}) exists — password reset`);
  } else {
    console.log(`user '${user.username}' (id ${user.id}) exists — password unchanged`);
  }

  const membership = await db.featureUser.findOne({
    where: { featureId: feature.id, userId: user.id },
  });
  if (membership) {
    await membership.update({ role: ADMIN_ROLE, status: ACTIVE_STATUS });
  } else {
    await db.featureUser.create({
      featureId: feature.id,
      userId: user.id,
      role: ADMIN_ROLE,
      status: ACTIVE_STATUS,
    });
  }
  console.log(`'${user.username}' is ${ADMIN_ROLE} of '${FEATURE_NAME}'`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`seed failed: ${err.message}`);
    process.exit(1);
  });
