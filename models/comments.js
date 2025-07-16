import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { Image } from "./images.js";
import { User } from "./users.js";

export const Comment = sequelize.define("Comment", {
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

Image.hasMany(Comment, { onDelete: "CASCADE" });
Comment.belongsTo(Image);

User.hasMany(Comment, { onDelete: "CASCADE" });
Comment.belongsTo(User);
