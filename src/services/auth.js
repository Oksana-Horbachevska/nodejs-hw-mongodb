import { User } from '../db/models/user.js';
import { Session } from '../db/models/session.js';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import createHttpError from 'http-errors';

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
    accessTokenValidUntil: new Date(Date.now() + 15 * 60 * 1000),
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
