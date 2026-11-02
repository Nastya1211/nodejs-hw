import { Router } from 'express';
import { celebrate } from 'celebrate';
import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
  requestResetEmail,
  resetPassword,
} from '../controllers/authController.js';
import {
  registerUserSchema,
  loginUserSchema,
  requestResetEmailSchema,
  resetPasswordSchema,
} from '../validations/authValidation.js';

const router = Router();

router.post(
  '/auth/register',
  celebrate({ body: registerUserSchema }),
  registerUser,
);
router.post('/auth/login', celebrate({ body: loginUserSchema }), loginUser);
router.post('/auth/refresh', refreshUserSession);
router.post('/auth/logout', logoutUser);

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
