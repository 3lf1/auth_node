import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function generateAccessToken(userId) {
    return jwt.sign({ userId },
        env.jwt.accessSecret,
        {
            expiresIn: env.jwt.accessExpiresIn
        }
    )
}

export function generateRefreshToken(userId, sessionId){
    return jwt.sign({
        userId,
        sessionId
    }, 
    env.jwt.refreshSecret, 
    {
        expiresIn: env.jwt.refreshExpiresIn
    })
}

export function verifyAccessToken(token) {
    return jwt.verify(
        token,
        env.jwt.accessSecret
    )
}

export function verifyRefreshToken(token) {
    return jwt.verify(
        token,
        env.jwt.refreshSecret
    )
}