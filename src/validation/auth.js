import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().max(64).required(),
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(6).max(30).required(),
});

export const loginUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const requestResetEmailSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).max(30).required(),
});
