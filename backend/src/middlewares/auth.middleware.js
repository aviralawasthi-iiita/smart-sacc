import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"
import { getCache, setCache } from "../db/redis.js"

export const verifyJWT = asyncHandler(async (req,res,next) => {
    try {
        const token = req.cookies?.accessToken|| req.header("Authorization")?.replace("Bearer ","");
        console.log("Token received:", token)
        if(!token){
            throw new ApiError(401,"unaothorize request");
        }
        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Try Redis cache first
        const cacheKey = `user:${decodedToken._id}`;
        let user = await getCache(cacheKey);

        if (!user) {
            // Cache miss — query MongoDB
            user = await User.findById(decodedToken?._id).select("-password -refreshToken");
            if (user) {
                // Store in Redis for 5 minutes
                await setCache(cacheKey, user.toJSON ? user.toJSON() : user, 300);
            }
        }

        if(!user){
            throw new ApiError(401,"invalid Acces TOken");
        }
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid acces toekn");
    }
})

