import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import handlebars from 'handlebars';
import path from 'node:path';
import fs from 'node:fs/promises';
import { User } from '../models/user.js';
import { sendEmail } from '../utils/sendMail.js';
import { env } from '../utils/env.js';

export async function requestResetEmail(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message: 'Password reset email sent successfully',
      });
    }

    const resetToken = jwt.sign({ sub: user._id, email }, env('JWT_SECRET'), {
      expiresIn: '15m',
    });

    const templatePath = path.join(
      process.cwd(),
      'src',
      'templates',
      'reset-password-email.html',
    );
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);

    const html = template({
      name: user.username || user.email,
      resetLink: `${env('FRONTEND_DOMAIN')}/reset-password?token=${resetToken}`,
    });

    try {
      await sendEmail({
        to: email,
        subject: 'Reset your password',
        html,
      });
    } catch {
      throw createHttpError(
        500,
        'Failed to send the email, please try again later.',
      );
    }

    res.status(200).json({
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { password, token } = req.body;

    let entries;
    try {
      entries = jwt.verify(token, env('JWT_SECRET'));
    } catch {
      throw createHttpError(401, 'Invalid or expired token');
    }

    const user = await User.findOne({
      _id: entries.sub,
      email: entries.email,
    });

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    await User.updateOne({ _id: user._id }, { password: encryptedPassword });

    res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
}
