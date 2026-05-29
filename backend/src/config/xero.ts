import { XeroClient } from 'xero-node';
import dotenv from 'dotenv';
dotenv.config();

export const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID!,
  clientSecret: process.env.XERO_CLIENT_SECRET!,
  redirectUris: [
    process.env.XERO_REDIRECT_URI!
  ],
  scopes: [
    'offline_access',
    'openid',
    'profile',
    'email',
    'accounting.contacts',
    'accounting.invoices',
  ]
});
