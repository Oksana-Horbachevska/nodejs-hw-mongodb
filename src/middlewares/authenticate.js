import createHttpError from 'http-errors';

import { Session } from '../db/models/session.js';
import { User } from '../db/models/user.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.get('Authorization');

  if (!authHeader) {
    throw createHttpError(401, 'Please provide Authorization header');
  }

  const bearer = authHeader.split(' ')[0];
  const accessToken = authHeader.split(' ')[1];

  if (bearer !== 'Bearer' || typeof accessToken !== 'string') {
    throw createHttpError(401, 'Auth header should be of type Bearer');
  }

  const session = await Session.findOne({ accessToken });

  if (!session) {
    throw createHttpError(401, 'Session not found');
  }

  if (session.accessTokenValidUntil < new Date()) {
    throw createHttpError(401, 'Access token expired');
  }

  const user = await User.findById(session.userId);

  if (!user) {
    throw createHttpError(401);
  }

  req.user = user;

  next();
};
