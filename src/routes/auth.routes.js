import { Router } from "express";

import {
  register,
  login,
  refresh,
} from "../controllers/auth.controller.js";

import validate from "../middleware/validate.js";
import { registerSchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;