import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import handlebars from 'handlebars';
import path from 'node:path';
import fs from 'node:fs/promises';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import { sendEmail } from '../utils/sendMail.js';
import { env } from '../utils/env.js';

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createHttpError(400, 'Email in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
    });

    const session = await createSession(newUser._id);
    setSessionCookies(res, session);

    res.status(201).json({
      status: 201,
      message: 'Successfully registered a user!',
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw createHttpError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createHttpError(401, 'Invalid credentials');
    }

    await Session.deleteOne({ userId: user._id });
    const session = await createSession(user._id);
    setSessionCookies(res, session);

    res.status(200).json({
      status: 200,
      message: 'Successfully logged in an user!',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshUserSession = async (req, res, next) => {
  try {
    const { sessionId, refreshToken } = req.cookies;

    const session = await Session.findOne({ _id: sessionId, refreshToken });
    if (!session) {
      throw createHttpError(401, 'Session not found');
    }

    if (new Date() > new Date(session.refreshTokenValidUntil)) {
      await Session.deleteOne({ _id: sessionId });
      res.clearCookie('sessionId');
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      throw createHttpError(401, 'Session token expired');
    }

    await Session.deleteOne({ _id: sessionId });

    const newSession = await createSession(session.userId);
    setSessionCookies(res, newSession);

    res.status(200).json({
      status: 200,
      message: 'Session refreshed',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies;

    if (sessionId) {
      await Session.deleteOne({ _id: sessionId });
    }

    res.clearCookie('sessionId');
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export async function requestResetEmail(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message: 'Password reset email sent successfully',
      });
    }

    const resetToken = jwt.sign(
      { sub: user._id, email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' },
    );

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
        from: process.env.SMTP_FROM,
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
      entries = jwt.verify(token, process.env.JWT_SECRET);
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
