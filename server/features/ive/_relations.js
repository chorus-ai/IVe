module.exports = (db) => {

  // ---------- user <-> iveEndpoint (createdBy) ----------
  db.user.hasMany(db.iveEndpoint, {
    foreignKey: { name: "userId", allowNull: false },
    onDelete: "CASCADE",
    hooks: true,
  });
  db.iveEndpoint.belongsTo(db.user, {
    as: "createdBy",
    foreignKey: { name: "userId", allowNull: false },
    onDelete: "CASCADE",
  });

  // ---------- user <-> iveLayout (createdBy) ----------
  db.user.hasMany(db.iveLayout, {
    foreignKey: { name: "userId", allowNull: false },
    onDelete: "CASCADE",
    hooks: true,
  });
  db.iveLayout.belongsTo(db.user, {
    as: "createdBy",
    foreignKey: { name: "userId", allowNull: false },
    onDelete: "CASCADE",
  });

  // ---------- user <-> iveWidget (createdBy) ----------
  db.user.hasMany(db.iveWidget, {
    foreignKey: { name: "userId", allowNull: false },
    onDelete: "CASCADE",
    hooks: true,
  });
  db.iveWidget.belongsTo(db.user, {
    as: "createdBy",
    foreignKey: { name: "userId", allowNull: false },
    onDelete: "CASCADE",
  });

  // ---------- iveEndpoint <-> iveTag ----------
  db.iveEndpoint.belongsToMany(db.iveTag, {
    through: db.iveEndpointTag,
    foreignKey: "iveEndpointId",
    otherKey: "iveTagId",
    onDelete: "CASCADE",
    hooks: true,
  });
  db.iveTag.belongsToMany(db.iveEndpoint, {
    through: db.iveEndpointTag,
    foreignKey: "iveTagId",
    otherKey: "iveEndpointId",
    onDelete: "CASCADE",
    hooks: true,
  });

  // ---------- iveLayout <-> iveTag ----------
  db.iveLayout.belongsToMany(db.iveTag, {
    through: db.iveLayoutTag,
    foreignKey: "iveLayoutId",
    otherKey: "iveTagId",
    onDelete: "CASCADE",
    hooks: true,
  });
  db.iveTag.belongsToMany(db.iveLayout, {
    through: db.iveLayoutTag,
    foreignKey: "iveTagId",
    otherKey: "iveLayoutId",
    onDelete: "CASCADE",
    hooks: true,
  });

  // ---------- iveWidget <-> iveTag ----------
  db.iveWidget.belongsToMany(db.iveTag, {
    through: db.iveWidgetTag,
    foreignKey: "iveWidgetId",
    otherKey: "iveTagId",
    onDelete: "CASCADE",
    hooks: true,
  });
  db.iveTag.belongsToMany(db.iveWidget, {
    through: db.iveWidgetTag,
    foreignKey: "iveTagId",
    otherKey: "iveWidgetId",
    onDelete: "CASCADE",
    hooks: true,
  });
};
