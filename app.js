import express from "express";
import bodyParser from "body-parser";

import { imageRouter } from "./routers/image_router.js";
import { commentRouter } from "./routers/comment_router.js";
import { userRouter } from "./routers/user_router.js";
import { sequelize } from "./datasource.js";

const PORT = 3000;
export const app = express();

app.use(bodyParser.json());

app.use(express.static("static"));

app.use((req, res, next) => {
  console.log("HTTP request", req.method, req.url, req.body);
  next();
});

try {
  await sequelize.authenticate();
  await sequelize.sync({ alter: { drop: false } });
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

// Mount routers
app.use("/api/images", imageRouter);
app.use("/api/images/:imageId/comments", commentRouter);
app.use("/api/users", userRouter);

app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
