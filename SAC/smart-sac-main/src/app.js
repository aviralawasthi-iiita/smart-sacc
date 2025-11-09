import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { ApiError } from "./utils/ApiError.js" // <-- 1. ADD THIS IMPORT


const app = express();
app.use(cors({
    origin: process.env.CorsOrigin,
    credentials: true
}));
app.use(express.json()); 
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "./routes/user.routes.js"
import adminRouter from "./routes/admin.routes.js"

app.use("/api/v1/users",userRouter);
app.use("/api/v1/admin",adminRouter);


// --- 2. ADD THIS ERROR HANDLER ---
// This MUST be the last piece of middleware before 'export'
// It catches any 'ApiError' thrown from your controllers.
app.use((err, req, res, next) => {
    // Check if the error is an instance of our custom ApiError
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
    }

    // For any other types of errors
    console.error("Unhandled Error:", err);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
});
// ------------------------------------

export {app};