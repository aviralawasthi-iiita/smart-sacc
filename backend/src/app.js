import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express();
app.use(cors({
    origin: process.env.CorsOrigin,
    credentials: true
}));
app.use(express.json()); 
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieParser());

import { ApiError } from "./utils/ApiError.js";

import userRouter from "./routes/user.routes.js";
import adminRouter from "./routes/admin.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);

app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
    }

    console.error("Unhandled Error:", err);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
});

export { app };