
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    // null means active; a Date means revoked.
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Useful for retrieving a user's active sessions.
sessionSchema.index({ userId: 1, revokedAt: 1 });

// Automatically delete expired sessions eventually.
// The service must still check expiresAt on every refresh.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = model("Session", sessionSchema);

export default Session;
