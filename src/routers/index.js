import { Router } from 'express';
import authRouter from './auth.js';
import contactRouter from './contacts.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

router.use('/contacts', authenticate, contactRouter);
router.use('/auth', authRouter);

export default router;
