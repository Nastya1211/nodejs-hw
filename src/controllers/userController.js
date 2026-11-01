import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export async function updateUserAvatarController(req, res, next) {
  try {
    if (!req.file) {
      throw createHttpError(400, 'No file');
    }

    const avatarUrl = await saveFileToCloudinary(req.file);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true },
    );

    if (!updatedUser) {
      throw createHttpError(404, 'User not found');
    }

    res.status(200).json({
      status: 200,
      message: 'Successfully updated avatar!',
      data: {
        url: updatedUser.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
}
