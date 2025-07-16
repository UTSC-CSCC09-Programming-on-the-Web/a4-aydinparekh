import express from "express";
import bodyParser from "body-parser";

import { imagesRouter } from "./routers/images_router.js";
import { commentsRouter } from "./routers/comments_router.js";
import { usersRouter } from "./routers/users_router.js";
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
app.use("/api/images", imagesRouter);
app.use("/api/images/:imageId/comments", commentsRouter);
app.use("/api/users", usersRouter);

app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
