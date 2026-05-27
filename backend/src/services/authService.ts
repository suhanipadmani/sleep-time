import { hashPassword, comparePassword } from '@/utils/bcrypt';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/utils/jwt';
import { config } from '@/config';
import crypto from 'crypto';
import { Role } from '@/enums';
import { AUTH_CONSTANTS } from '@/constants';
import { AUTH_MESSAGES } from '@/messages';
import { ApiError } from '@/utils/ApiError';
import { userModel } from '@/models/userModel';

export const authService = {
  async seedAdmin() {
    const adminEmail = config.adminSeed.email;

    const existingAdmin = await userModel.findByEmail(adminEmail);
    if (existingAdmin) {
      return;
    }

    const hashedPassword = await hashPassword(config.adminSeed.password);

    await userModel.create({
      email: adminEmail,
      password: hashedPassword,
      first_name: config.adminSeed.firstName,
      last_name: config.adminSeed.lastName,
      role: Role.ADMIN,
    });

    return { success: true, message: AUTH_MESSAGES.ADMIN_SEEDED_SUCCESS };
  },

  async login(email: string, password: string) {
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const isMatch = await comparePassword(password, user.password as string);

    if (!isMatch) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

    await userModel.updateRefreshToken(user.id, refreshToken);

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        }
      }
    };
  },

  async forgotPassword(email: string) {
    const user = await userModel.findByEmail(email);
    if (!user) {
      return { success: true, message: AUTH_MESSAGES.RESET_LINK_SENT };
    }

    const resetToken = crypto.randomBytes(AUTH_CONSTANTS.RESET_PASSWORD_TOKEN_BYTES).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + AUTH_CONSTANTS.RESET_PASSWORD_EXPIRES_IN_MS);

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await userModel.updateResetToken(email, hashedToken, resetPasswordExpires);

    console.log(`[Mock Email] To: ${email}, Password Reset Token: ${resetToken}`);

    return { success: true, message: AUTH_MESSAGES.RESET_LINK_SENT };
  },

  async resetPassword(token: string, password: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await userModel.findByResetToken(hashedToken);

    if (!user) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_RESET_TOKEN);
    }

    const hashedPassword = await hashPassword(password);

    await userModel.updatePassword(user.id, hashedPassword);

    return { success: true, message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS };
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userModel.findById(userId);

    if (!user) {
      throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);
    }

    const isMatch = await comparePassword(currentPassword, user.password as string);
    if (!isMatch) {
      throw new ApiError(400, AUTH_MESSAGES.INCORRECT_CURRENT_PASSWORD);
    }

    const hashedPassword = await hashPassword(newPassword);
    await userModel.updatePassword(userId, hashedPassword);

    return { success: true, message: AUTH_MESSAGES.PASSWORD_CHANGED_SUCCESS };
  },

  async getProfile(userId: string) {
    const user = await userModel.findById(userId);

    if (!user) {
      throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);
    }

    const { password, refresh_token, reset_password_token, reset_password_expires, ...profile } = user;

    return { success: true, data: profile };
  },

  async updateProfile(userId: string, firstName?: string, lastName?: string) {
    const user = await userModel.updateProfile(userId, firstName, lastName);

    const { password, refresh_token, reset_password_token, reset_password_expires, ...profile } = user;

    return { success: true, data: profile };
  },

  async refreshToken(token: string) {
    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED_INVALID_TOKEN);
    }

    const user = await userModel.findById(decoded.id);
    if (!user || user.refresh_token !== token) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED_INVALID_TOKEN);
    }

    const accessToken = generateAccessToken({ id: user.id, role: user.role });

    return {
      success: true,
      data: {
        accessToken
      }
    };
  }
};
