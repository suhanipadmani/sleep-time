import { xero } from '@/config/xero';
import { pool } from '@/db';
import { logger } from '@/logger';
import { TokenSet } from 'xero-node';

export class XeroAuthService {
  /**
   * Generates the consent URL to connect Xero
   */
  public async getConsentUrl(): Promise<string> {
    try {
      
      try {
        await xero.initialize();
        logger.info('Xero successfully initialized!');
      } catch (initError) {
        logger.error('Xero initialization failed:', initError);
        throw initError;
      }

      const consentUrl = await xero.buildConsentUrl();
      return consentUrl;
    } catch (error) {
      logger.error('Error building Xero consent URL:', error);
      throw new Error('Failed to generate Xero consent URL');
    }
  }

  /**
   * Handles the callback from Xero, exchanges code for tokens, and saves them
   */
  public async handleCallback(url: string): Promise<void> {
    try {

      try {
        await xero.initialize();
        logger.info('Xero successfully initialized!');
      } catch (initError) {
        logger.error('Xero initialization failed:', initError);
        throw initError;
      }
      const tokenSet = await xero.apiCallback(url);
      
      // Update tenant
      await xero.updateTenants();
      const tenants = xero.tenants;
      
      if (!tenants || tenants.length === 0) {
        throw new Error('No tenants found for this Xero connection.');
      }
      
      const activeTenant = tenants[0];
      await this.saveTokens(tokenSet, activeTenant.tenantId);
    } catch (error) {
      console.log("Xero error:", error);
      logger.error('Error handling Xero callback:', error);
      throw error;
    }
  }

  /**
   * Ensures a valid token set is applied to the Xero client before making API calls.
   * Fetches the token from the DB, checks expiry, refreshes if needed.
   */
  public async getValidTokenSet(): Promise<void> {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM xero_tokens ORDER BY created_at DESC LIMIT 1');
      
      if (result.rowCount === 0) {
        client.release();
        throw new Error('Xero is not connected. Please connect Xero first.');
      }
      
      const tokenRecord = result.rows[0];
      
      const tokenSet = new TokenSet({
        access_token: tokenRecord.access_token,
        refresh_token: tokenRecord.refresh_token,
        expires_in: Math.floor((new Date(tokenRecord.expires_at).getTime() - Date.now()) / 1000)
      });
      
      xero.setTokenSet(tokenSet);
      
      if (tokenSet.expired()) {
        logger.info('Xero token expired, refreshing...');
        const validTokenSet = await xero.refreshToken();
        await this.saveTokens(validTokenSet, tokenRecord.tenant_id);
      }
      
      // Set the active tenant so the invoice service can access it
      const tenants = await xero.updateTenants();
      if (!tenants || tenants.length === 0) {
         throw new Error('No active Xero tenants found during token validation.');
      }

      client.release();
    } catch (error) {
      logger.error('Error validating Xero token:', error);
      throw error;
    }
  }

  /**
   * Save or update tokens in the database
   */
  private async saveTokens(tokenSet: TokenSet, tenantId: string): Promise<void> {
    const client = await pool.connect();
    try {
      // For a single organization, we can just clear existing and insert new
      await client.query('DELETE FROM xero_tokens');
      
      const expiresAt = new Date(Date.now() + (tokenSet.expires_in! * 1000)).toISOString();
      
      await client.query(`
        INSERT INTO xero_tokens (access_token, refresh_token, tenant_id, expires_at)
        VALUES ($1, $2, $3, $4)
      `, [tokenSet.access_token, tokenSet.refresh_token, tenantId, expiresAt]);
      
    } catch (error) {
      logger.error('Error saving Xero tokens:', error);
      throw new Error('Failed to save Xero tokens');
    } finally {
      client.release();
    }
  }
}

export const xeroAuthService = new XeroAuthService();
