import fs from 'node:fs/promises';
import path from 'node:path';
import { User } from '../db/models/user.js';
import { Session } from '../db/models/session.js';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import Handlebars from 'handlebars';
import { getEnvVar } from '../utils/getEnvVar.js';
import { sendMail } from '../utils/sendMail.js';

const REQUEST_PASSWORD_RESET_TEMPLATE_PATH = path.resolve(
  'src/templates/send-reset-email.html',
);
const REQUEST_PASSWORD_RESET_TEMPLATE = await fs.readFile(
  REQUEST_PASSWORD_RESET_TEMPLATE_PATH,
  { encoding: 'UTF-8' },
);

export const registerUser = async (payload) => {
  const user = await User.findOne({ email: payload.email });
  if (user) {
    throw createHttpError(409, 'Email in use');
  }
  const encryptedPassword = await bcrypt.hash(payload.password, 10);
  return await User.create({ ...payload, password: encryptedPassword });
};

export const loginUser = async (payload) => {
  const user = await User.findOne({ email: payload.email });
  if (!user) {
    throw createHttpError(401, 'User not found');
  }
  const isMatch = await bcrypt.compare(payload.password, user.password); // Порівнюємо хеші паролів
  if (!isMatch) {
    throw createHttpError(401, 'Unauthorized');
  }
  await Session.deleteOne({ userId: user._id });
  const accessToken = crypto.randomBytes(30).toString('base64');
  const refreshToken = crypto.randomBytes(30).toString('base64');

  return await Session.create({
    userId: user._id,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + 150 * 60 * 1000),
    refreshTokenValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
};

export const logoutUser = async (sessionId) => {
  await Session.deleteOne({ _id: sessionId });
};

const createSession = () => {
  const accessToken = crypto.randomBytes(30).toString('base64');
  const refreshToken = crypto.randomBytes(30).toString('base64');
  return {
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + 15 * 60 * 1000),
    refreshTokenValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };
};

export const refreshUserSession = async ({ sessionId, refreshToken }) => {
  const session = await Session.findOne({ _id: sessionId, refreshToken });
  if (!session) {
    throw createHttpError(401, 'Session not found');
  }
  const isSessionTokenIspired =
    new Date() > new Date(session.refreshTokenValidUntil);
  if (isSessionTokenIspired) {
    throw createHttpError(401, 'Session token ispired');
  }
  const newSession = createSession();
  await Session.deleteOne({ _id: sessionId, refreshToken });
  return await Session.create({
    userId: session.userId,
    ...newSession,
  });
};

export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email });
  if (user === null) {
    throw createHttpError(404, 'User not found!');
  }
  const token = jwt.sign({ sub: user._id, email }, getEnvVar('JWT_SECRET'), {
    expiresIn: '5m',
  });
  const template = Handlebars.compile(REQUEST_PASSWORD_RESET_TEMPLATE);
  await sendMail({
    from: getEnvVar('SMTP_FROM'),
    to: email,
    subject: 'Reset your password',
    html: template({
      resetPasswordLink: `${getEnvVar(
        'APP_DOMAIN',
      )}/reset-password?token=${token}`,
    }),
  });
};

export const resetPassword = async (token, password) => {
  try {
    const decoded = jwt.verify(token, getEnvVar('JWT_SECRET'));
    const user = await User.findOne({
      _id: decoded.sub,
      email: decoded.email,
    });
    if (!user) {
      throw createHttpError(404, 'User not found!');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate(
      { _id: user._id },
      { password: hashedPassword },
    );
    await Session.deleteOne({ userId: user._id });
  } catch (error) {
    if (
      error.name === 'TokenExpiredError' ||
      error.name === 'JsonWebTokenError'
    ) {
      throw createHttpError(401, 'Token is expired or invalid.');
    }
    throw error;
  }
};
