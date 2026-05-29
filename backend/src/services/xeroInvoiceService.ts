import { xero } from '@/config/xero';
import { xeroAuthService } from './xeroAuthService';
import { pool } from '@/db';
import { logger } from '@/logger';
import { Contact, Invoice, LineItem } from 'xero-node';

export class XeroInvoiceService {
  /**
   * Retrieves an existing contact by email or creates a new one in Xero
   */
  private async getOrCreateContact(tenantId: string, user: { id: string, email: string, first_name: string, last_name: string }): Promise<Contact> {
    try {
      // 1. Search for existing contact by email
      const searchResponse = await xero.accountingApi.getContacts(tenantId, undefined, `EmailAddress=="${user.email}"`);
      
      if (searchResponse.body.contacts && searchResponse.body.contacts.length > 0) {
        logger.info(`Found existing Xero contact for email: ${user.email}`);
        return searchResponse.body.contacts[0];
      }

      // 2. Create new contact if not found
      logger.info(`Creating new Xero contact for email: ${user.email}`);
      const createResponse = await xero.accountingApi.createContacts(tenantId, {
        contacts: [
          {
            name: `${user.first_name} ${user.last_name}`,
            firstName: user.first_name,
            lastName: user.last_name,
            emailAddress: user.email
          }
        ]
      });

      if (!createResponse.body.contacts || createResponse.body.contacts.length === 0) {
        throw new Error('Failed to create Xero contact.');
      }

      return createResponse.body.contacts[0];
    } catch (error) {
      logger.error('Error in getOrCreateContact:', error);
      throw error;
    }
  }

  /**
   * Creates an invoice in Xero and stores it in the local database
   */
  public async createInvoice(userId: string, lineItems: LineItem[]): Promise<Invoice> {
    const client = await pool.connect();
    
    try {
      // 1. Fetch user details from DB
      const userResult = await client.query('SELECT id, email, first_name, last_name FROM users WHERE id = $1', [userId]);
      if (userResult.rowCount === 0) {
        throw new Error(`User with ID ${userId} not found`);
      }
      const user = userResult.rows[0];

      // 2. Ensure Xero token is valid
      await xeroAuthService.getValidTokenSet();
      
      // 3. Get active tenant
      if (!xero.tenants || xero.tenants.length === 0) {
        throw new Error('No active Xero tenants found.');
      }
      const tenantId = xero.tenants[0].tenantId;

      // 4. Get or Create Contact
      const contact = await this.getOrCreateContact(tenantId, user);

      // 5. Create Invoice in Xero
      logger.info(`Creating Xero invoice for contact ID: ${contact.contactID}`);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

      // Ensure line items have an accountCode if missing, '200' is the default Sales account in Xero
      const formattedLineItems = lineItems.map(item => ({
        ...item,
        accountCode: item.accountCode || '200' 
      }));

      const invoiceResponse = await xero.accountingApi.createInvoices(tenantId, {
        invoices: [
          {
            type: Invoice.TypeEnum.ACCREC,
            contact: {
              contactID: contact.contactID
            },
            dueDate: dueDate.toISOString().split('T')[0], 
            lineItems: formattedLineItems,
            status: Invoice.StatusEnum.AUTHORISED
          }
        ]
      });

      if (!invoiceResponse.body.invoices || invoiceResponse.body.invoices.length === 0) {
        throw new Error('Failed to create invoice in Xero.');
      }

      const xeroInvoice = invoiceResponse.body.invoices[0];

      // 6. Store invoice in local database
      await client.query(`
        INSERT INTO invoices (xero_invoice_id, user_id, customer_name, amount, status)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        xeroInvoice.invoiceID,
        userId,
        contact.name,
        xeroInvoice.total,
        xeroInvoice.status
      ]);
      
      logger.info(`Invoice ${xeroInvoice.invoiceID} successfully created and stored locally.`);
      
      return xeroInvoice;
    } catch (error) {
      logger.error('Error in createInvoice:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export const xeroInvoiceService = new XeroInvoiceService();
