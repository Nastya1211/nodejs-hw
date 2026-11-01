import { Router } from 'express';
import { celebrate } from 'celebrate';
import {
  requestResetEmail,
  resetPassword,
} from '../controllers/authController.js';
import {
  requestResetEmailSchema,
  resetPasswordSchema,
} from '../validations/authValidation.js';

const router = Router();

router.post(
  '/auth/request-reset-email',
  celebrate({ body: requestResetEmailSchema }),
  requestResetEmail,
);

router.post(
  '/auth/reset-password',
  celebrate({ body: resetPasswordSchema }),
  resetPassword,
);

export default router;
