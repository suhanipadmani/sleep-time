import { XeroClient } from 'xero-node';
import dotenv from 'dotenv';
dotenv.config();

export const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID!,
  clientSecret: process.env.XERO_CLIENT_SECRET!,
  redirectUris: [
    process.env.XERO_REDIRECT_URI || 'https://unchallengeably-semimythical-adonis.ngrok-free.dev/api/xero/callback'
  ],
  scopes: [
    'openid',
    'profile',
    'email',
    'offline_access',
    'accounting.transactions',
    'accounting.contacts'
  ]
});
