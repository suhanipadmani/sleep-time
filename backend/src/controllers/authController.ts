import { Request, Response } from 'express';
import { authService } from '@/services/authService';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiResponse } from '@/utils/ApiResponse';
import { AUTH_MESSAGES } from '@/messages';

export const seedAdmin = asyncHandler(async (req: Request, res: Response) => {
  await authService.seedAdmin();
  res.status(201).json(new ApiResponse(201, AUTH_MESSAGES.ADMIN_SEEDED_SUCCESS));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.status(200).json(new ApiResponse(200, AUTH_MESSAGES.LOGIN_SUCCESS, result.data));
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  res.status(200).json(new ApiResponse(200, AUTH_MESSAGES.RESET_LINK_SENT));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  res.status(200).json(new ApiResponse(200, AUTH_MESSAGES.PASSWORD_RESET_SUCCESS));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.id;
  await authService.changePassword(userId, currentPassword, newPassword);
  res.status(200).json(new ApiResponse(200, AUTH_MESSAGES.PASSWORD_CHANGED_SUCCESS));
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await authService.getProfile(userId);
  res.status(200).json(new ApiResponse(200, AUTH_MESSAGES.PROFILE_FETCHED_SUCCESS, result.data));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { firstName, lastName } = req.body;
  const result = await authService.updateProfile(userId, firstName, lastName);
  res.status(200).json(new ApiResponse(200, AUTH_MESSAGES.PROFILE_UPDATED_SUCCESS, result.data));
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshToken(refreshToken);
  res.status(200).json(new ApiResponse(200, AUTH_MESSAGES.TOKEN_REFRESHED_SUCCESS, result.data));
});
