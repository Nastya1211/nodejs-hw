import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export async function updateUserAvatar(req, res, next) {
  try {
    if (!req.file) {
      throw createHttpError(400, 'No file');
    }

    const uploadResult = await saveFileToCloudinary(
      req.file.buffer,
      req.user._id,
    );

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: uploadResult.secure_url },
      { returnDocument: 'after' },
    );

    if (!updatedUser) {
      throw createHttpError(404, 'User not found');
    }

    res.status(200).json({
      url: updatedUser.avatar,
    });
  } catch (error) {
    next(error);
  }
}
