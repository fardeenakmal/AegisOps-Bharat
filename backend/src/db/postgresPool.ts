import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://emergency_user:emergency_secure_pass_2026@localhost:5432/emergency_db';

export class PostgresService {
  private pool: Pool | null = null;
  public isConnected = false;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      this.pool = new Pool({
        connectionString,
        max: 20, // 20 pooled connections
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 3000
      });

      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      this.isConnected = true;
      console.log('[PostgreSQL + PostGIS] Successfully connected to database pool.');
    } catch (err: any) {
      console.warn(`[PostgreSQL + PostGIS] Pool connection notice: ${err.message}. Operating in resilient memory-store mode.`);
      this.isConnected = false;
    }
  }

  async query(text: string, params: any[] = []): Promise<any[]> {
    if (!this.isConnected || !this.pool) {
      return [];
    }
    try {
      const start = Date.now();
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      if (duration > 500) {
        console.warn(`[Slow Query Alert] ${duration}ms for: ${text.slice(0, 80)}...`);
      }
      return res.rows;
    } catch (err) {
      console.error('[PostGIS Query Error]', err);
      return [];
    }
  }

  // Native PostGIS Radius Search
  async findIncidentsWithinRadius(lat: number, lng: number, radiusMeters: number = 1500) {
    const sql = `
      SELECT id, tracking_code, title, type, severity_score, severity_label, status,
             ST_Distance(canonical_location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters
      FROM incidents
      WHERE ST_DWithin(canonical_location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      ORDER BY distance_meters ASC;
    `;
    return this.query(sql, [lng, lat, radiusMeters]);
  }
}

export const postgresService = new PostgresService();
