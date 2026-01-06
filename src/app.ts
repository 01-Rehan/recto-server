import express from "express";
import cors from "cors";
import { globalLimiter } from "./middlewares/rateLimiter.middleware";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  }),
);

// Apply global rate limiter to all endpoints
app.use(globalLimiter);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// route import
import UserRouter from "./routes/user.route";
import SearchRouter from "./routes/search.route";
import BookRouter from "./routes/book.route";
import ConnectionRouter from "./routes/connection.route";
import ListRouter from "./routes/list.route";

// define the route
app.use("/api/v1/user", UserRouter);
app.use("/api/v1/search", SearchRouter);
app.use("/api/v1/books", BookRouter);
app.use("/api/v1/connection", ConnectionRouter);
app.use("/api/v1/lists", ListRouter);

export default app;
