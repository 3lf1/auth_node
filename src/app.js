import helmet from "helmet";
import express from "express";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import requestId from "./middleware/requestId.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(requestId);

app.use(helmet());

app.use(express.json());
app.use(cookieParser());


app.use("/api/auth", authRoutes);

// Handle requests that match no route.
app.use(notFound);

// Centralized error handling must be last.
app.use(errorHandler);

export default app;
