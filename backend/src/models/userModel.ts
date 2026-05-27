import { pool } from '@/db';

export interface User {
  id: string;
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  role: string;
  refresh_token?: string | null;
  reset_password_token?: string | null;
  reset_password_expires?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const userModel = {
  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async findById(id: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByResetToken(token: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [token]
    );
    return result.rows[0] || null;
  },

  async create(userData: Partial<User>): Promise<User> {
    const { email, password, first_name, last_name, role } = userData;
    const result = await pool.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [email, password, first_name, last_name, role]
    );
    return result.rows[0];
  },

  async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
    await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, id]);
  },

  async updateResetToken(email: string, hashedToken: string, expires: Date): Promise<void> {
    await pool.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
      [hashedToken, expires, email]
    );
  },

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await pool.query(
      'UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL, updated_at = NOW() WHERE id = $2',
      [hashedPassword, id]
    );
  },

  async updateProfile(id: string, firstName?: string, lastName?: string): Promise<User> {
    const result = await pool.query(
      'UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), updated_at = NOW() WHERE id = $3 RETURNING id, email, first_name, last_name, role, created_at, updated_at',
      [firstName, lastName, id]
    );
    return result.rows[0];
  }
};
