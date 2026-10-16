import argon2 from 'argon2';

import User from '../models/User.js';
import Session from '../models/Session.js';

import AppError from '../errors/appError.js';
import ErrorCodes from '../errors/errorCodes.js';

import * as tokenService from './token.service.js';

import { env } from '../config/env.js';
import { expiryToMilliseconds } from '../utils/helperFunctions.js';

export async function registerUser({ username, email, password }) {
    const existingUser = await User.findOne({
        $or: [
            { username: username },
            { email: email }
        ]
    })

    if(existingUser) {
        if(existingUser.email === email) {
            throw new AppError(
                'A user with this email already exists', 
                409, 
                ErrorCodes.USER_ALREADY_EXISTS
            );
        }

        throw new AppError(
            'A user with this username already exists', 
            409, 
            ErrorCodes.USER_ALREADY_EXISTS
        );
    }

    const user = await User.create({
        username,
        email,
        password
    })

    return{
        id: user._id,
        username: user.username,
        email: user.email
    }
}

export async function loginUser({ email, password }) {
    const user = await User
        .findOne({ email })
        .select('+password');

    if(!user) {
        throw new AppError(
            'Invalid email or password',
            401,
            ErrorCodes.INVALID_CREDENTIALS
        )
    }
    
    const isPasswordValid = await user.comparePassword(password);

    if(!isPasswordValid) {
        throw new AppError(
            'Invalid email or password',
            401,
            ErrorCodes.INVALID_CREDENTIALS
        )
    }

    const session = new Session({
        userId: user._id,

        expiresAt: new Date(
            Date.now() + 
            expiryToMilliseconds(
                env.jwt.refreshExpiresIn
            )
        )
    })

    const refreshToken = tokenService.generateRefreshToken(
        user._id,
        session._id
    );

    session.hashedRefreshToken = await argon2.hash(refreshToken);

    await session.save();

    const accessToken = tokenService.generateAccessToken(user._id);

    return {
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        },
        accessToken,
        refreshToken
    }
}

export async function refreshAccessToken(refreshToken) {
  let payload;

  try {
    payload = tokenService.verifyRefreshToken(refreshToken);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError(
        "Refresh token has expired",
        401,
        ErrorCodes.TOKEN_EXPIRED
      );
    }

    throw new AppError(
      "Invalid refresh token",
      401,
      ErrorCodes.INVALID_TOKEN
    );
  }

  const session = await Session.findById(payload.sessionId)
    .select("+hashedRefreshToken");

  if (!session) {
    throw new AppError(
      "Session not found",
      401,
      ErrorCodes.UNAUTHORIZED
    );
  }

  // Ensure the token identity matches the session owner.
  if (String(session.userId) !== String(payload.userId)) {
    throw new AppError(
      "Refresh token does not match session",
      401,
      ErrorCodes.INVALID_TOKEN
    );
  }

  // Reject revoked or expired sessions.
  if (
    session.revokedAt ||
    session.expiresAt <= new Date()
  ) {
    throw new AppError(
      "Session is no longer valid",
      401,
      ErrorCodes.UNAUTHORIZED
    );
  }

  // Verify the presented token against the stored hash.
  const isValid = await argon2.verify(
    session.hashedRefreshToken,
    refreshToken
  );

  if (!isValid) {
    throw new AppError(
      "Invalid refresh token",
      401,
      ErrorCodes.INVALID_TOKEN
    );
  }

  // Generate a replacement refresh token.
  const newRefreshToken = tokenService.generateRefreshToken(
    String(session.userId),
    String(session._id)
  );

  const newRefreshTokenHash = await argon2.hash(
    newRefreshToken
  );

  // Atomically replace the hash only if the session
  // still contains the hash we just verified.
  const result = await Session.updateOne(
    {
      _id: session._id,
      hashedRefreshToken: session.hashedRefreshToken,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        hashedRefreshToken: newRefreshTokenHash,
      },
    }
  );

  if (result.modifiedCount !== 1) {
    throw new AppError(
      "Refresh token has already been used or the session changed",
      401,
      ErrorCodes.UNAUTHORIZED
    );
  }

  // Issue a new access token after successful rotation.
  const accessToken = tokenService.generateAccessToken(
    String(session.userId)
  );

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logoutUser(userId, sessionId) {
  const session = await Session.findOneAndUpdate(
    {
      _id: sessionId,
      userId: userId,
      revokedAt: { $exists: false },
    },
    {
      $set: { revokedAt: new Date() },
    }
  )

  if (!session) {
    throw new AppError(
      "Active session not found",
      404,
      ErrorCodes.NOT_AUTHORIZED
    );
  }

}