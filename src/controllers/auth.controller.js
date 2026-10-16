import * as authService from '../services/auth.services.js';

import { env } from './config/env.js';
import { expiryToMilliseconds } from './utils/helperFunctions.js';
import { asyncHandler } from './utils/helperFunctions.js';

export const register = asyncHandler(
    async (req,res) => {
        const user = await authService.registerUser(
            req.body
        )

        return res.status(201).json({
            success:true,
            user
        })
    }
)

export const login = asyncHandler(
    async (req,res) => {
        const result = await authService.loginUser(
            req.body
        )

        res.cookie(
            'refreshToken',
            result.refreshToken,
            {
                httpOnly: true,
                secure: env.cookie.secure,
                sameSite: env.cookie.sameSite,
                maxAge: expiryToMilliseconds(
                    env.jwt.refreshExpiresIn
                )
            }
        )

        return res.status(200).json({
            success:true,
            user: result.user,
            accessToken: result.accessToken
        })
    }
)

export const refresh = asyncHandler(
    async(req, res) => {
        const refreshToken = req.cookies.refreshToken

        const result = await authService.refreshAccessToken(
            refreshToken
        )
        
        return res.status(200).json({
            success: true,
            accessToken: result.accessToken
        })
    }
)

export const logout = asyncHandler(
    async(req, res, next) => {
        await authService.logoutUser(
            req.user.id,
            req.user.sessionId
        )

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "lax",
            path: "/api/auth",
        })

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        })
    }
)