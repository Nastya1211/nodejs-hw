import { Router } from 'express';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import { authenticate } from '../middlewares/authenticate.js';
import { upload } from '../middlewares/multer.js';
import { updateUserAvatarController } from '../controllers/userController.js';

const router = Router();

router.patch(
  '/me/avatar',
  authenticate,
  upload.single('avatar'),
  ctrlWrapper(updateUserAvatarController),
);

export default router;
