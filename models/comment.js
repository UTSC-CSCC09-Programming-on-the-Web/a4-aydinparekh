import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { Image } from "./image.js";
import { User } from "./user.js";

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
