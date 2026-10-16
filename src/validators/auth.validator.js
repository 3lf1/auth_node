import joi from 'joi';

export const registerSchema = Joi.object({
    username: joi.string()
        .min(3)
        .max(30)
        .required(),

    email: joi.string()
        .email()
        .pattern(/@gmail\.com$/)
        .required(),

    password: joi.string()
        .min(8)
        .max(128)
        .pattern(/[a-z]/, "lowercase letter")
        .pattern(/[A-Z]/, "uppercase letter")
        .pattern(/[0-9]/, "number")
        .pattern(/[!@#$%^&*(),.?":{}|<>_\-\\[\]/+=~`';]/, "special character")
        .required(),
})