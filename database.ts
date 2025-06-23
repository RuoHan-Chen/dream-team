import sqlite3 from 'sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// Ensure data directory exists
const dbPath = './data/settlement-search.db';
const dataDir = dirname(dbPath);
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(dbPath);

// Promisify database methods
const dbRun = (sql: string, ...params: any[]): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, ...params, function (this: sqlite3.RunResult, err: Error | null) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql: string, ...params: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, ...params, (err: Error | null, row: any) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql: string, ...params: any[]): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, ...params, (err: Error | null, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Enable WAL mode for better concurrency
db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      address TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_address TEXT NOT NULL,
      query TEXT NOT NULL,
      scheduled_for DATETIME,
      executed_at DATETIME,
      status TEXT CHECK(status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_address) REFERENCES users(address)
    );

    CREATE TABLE IF NOT EXISTS query_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query_id INTEGER NOT NULL,
      summary TEXT,
      sources TEXT, -- JSON string
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (query_id) REFERENCES queries(id)
    );

    CREATE TABLE IF NOT EXISTS market_queries (
      market_contract_address TEXT PRIMARY KEY,
      query_id INTEGER NOT NULL,
      market_question TEXT NOT NULL,
      creator_address TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (query_id) REFERENCES queries(id)
    );

    CREATE INDEX IF NOT EXISTS idx_queries_user_address ON queries(user_address);
    CREATE INDEX IF NOT EXISTS idx_queries_scheduled_for ON queries(scheduled_for);
    CREATE INDEX IF NOT EXISTS idx_queries_status ON queries(status);
    CREATE INDEX IF NOT EXISTS idx_market_queries_query_id ON market_queries(query_id);
  `);

  // Run migrations
  runMigrations();
});

// Database migrations
function runMigrations() {
  // Create migrations table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration 1: Add user_email column to queries table
  db.get('SELECT name FROM migrations WHERE name = ?', ['add_user_email_column'], (err, row) => {
    if (err) {
      console.error('Error checking migrations:', err);
      return;
    }

    if (!row) {
      // Check if column already exists
      db.get("PRAGMA table_info(queries)", (err, result) => {
        if (err) {
          console.error('Error checking table info:', err);
          return;
        }

        // Get all columns
        db.all("PRAGMA table_info(queries)", (err, columns) => {
          if (err) {
            console.error('Error getting table columns:', err);
            return;
          }

          const hasUserEmailColumn = columns.some((col: any) => col.name === 'user_email');
          
          if (!hasUserEmailColumn) {
            console.log('Running migration: add_user_email_column');
            db.run('ALTER TABLE queries ADD COLUMN user_email TEXT', (err) => {
              if (err) {
                console.error('Error adding user_email column:', err);
                return;
              }

              // Record the migration
              db.run('INSERT INTO migrations (name) VALUES (?)', ['add_user_email_column'], (err) => {
                if (err) {
                  console.error('Error recording migration:', err);
                } else {
                  console.log('Migration add_user_email_column completed successfully');
                }
              });
            });
          } else {
            // Column exists, just record the migration if not already recorded
            db.run('INSERT OR IGNORE INTO migrations (name) VALUES (?)', ['add_user_email_column']);
          }
        });
      });
    }
  });

  // Migration 2: Add creator_address column to market_queries table
  db.get('SELECT name FROM migrations WHERE name = ?', ['add_creator_address_column'], (err, row) => {
    if (err) {
      console.error('Error checking migrations:', err);
      return;
    }

    if (!row) {
      // Check if column already exists
      db.all("PRAGMA table_info(market_queries)", (err, columns) => {
        if (err) {
          console.error('Error getting table columns:', err);
          return;
        }

        const hasCreatorAddressColumn = columns.some((col: any) => col.name === 'creator_address');
        
        if (!hasCreatorAddressColumn) {
          console.log('Running migration: add_creator_address_column');
          // Add column with a default value for existing rows
          db.run('ALTER TABLE market_queries ADD COLUMN creator_address TEXT NOT NULL DEFAULT "0xUNKNOWN"', (err) => {
            if (err) {
              console.error('Error adding creator_address column:', err);
              return;
            }

            // Record the migration
            db.run('INSERT INTO migrations (name) VALUES (?)', ['add_creator_address_column'], (err) => {
              if (err) {
                console.error('Error recording migration:', err);
              } else {
                console.log('Migration add_creator_address_column completed successfully');
              }
            });
          });
        } else {
          // Column exists, just record the migration if not already recorded
          db.run('INSERT OR IGNORE INTO migrations (name) VALUES (?)', ['add_creator_address_column']);
        }
      });
    }
  });

  // Migration 3: Add agent resolution columns to market_queries table
  db.get('SELECT name FROM migrations WHERE name = ?', ['add_agent_resolution_columns'], (err, row) => {
    if (err) {
      console.error('Error checking migrations:', err);
      return;
    }

    if (!row) {
      console.log('Running migration: add_agent_resolution_columns');
      
      // Add columns for storing agent resolution data
      const alterTableQueries = [
        'ALTER TABLE market_queries ADD COLUMN agent_resolved BOOLEAN DEFAULT FALSE',
        'ALTER TABLE market_queries ADD COLUMN agent_outcome BOOLEAN',
        'ALTER TABLE market_queries ADD COLUMN agent_resolution_tx TEXT',
        'ALTER TABLE market_queries ADD COLUMN agent_resolved_at DATETIME',
        'ALTER TABLE market_queries ADD COLUMN agent_analysis TEXT'
      ];

      let completed = 0;
      alterTableQueries.forEach(query => {
        db.run(query, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error in migration:', err);
          }
          completed++;
          
          if (completed === alterTableQueries.length) {
            // Record the migration
            db.run('INSERT OR IGNORE INTO migrations (name) VALUES (?)', ['add_agent_resolution_columns'], (err) => {
              if (err) {
                console.error('Error recording migration:', err);
              } else {
                console.log('Migration add_agent_resolution_columns completed successfully');
              }
            });
          }
        });
      });
    }
  });
}

// SQL statements
const sql = {
  createUser: 'INSERT OR IGNORE INTO users (address) VALUES (?)',

  createQuery: `
    INSERT INTO queries (user_address, query, scheduled_for, user_email, status)
    VALUES (?, ?, ?, ?, ?)
  `,

  getPendingQueries: `
    SELECT * FROM queries
    WHERE user_address = ? AND status = 'pending'
    ORDER BY scheduled_for ASC
  `,

  getQueryHistory: `
    SELECT q.*, r.summary, r.sources, r.error
    FROM queries q
    LEFT JOIN query_results r ON q.id = r.query_id
    WHERE q.user_address = ? AND q.status IN ('completed', 'failed')
    ORDER BY q.executed_at DESC
    LIMIT ?
  `,

  getQueriesForExecution: `
    SELECT * FROM queries
    WHERE status = 'pending' AND datetime(scheduled_for) <= datetime('now')
    ORDER BY scheduled_for ASC
  `,

  updateQueryStatus: `
    UPDATE queries
    SET status = ?, executed_at = CASE WHEN ? IN ('completed', 'failed') THEN datetime('now') ELSE executed_at END
    WHERE id = ?
  `,

  createQueryResult: `
    INSERT INTO query_results (query_id, summary, sources, error)
    VALUES (?, ?, ?, ?)
  `,

  getQueryById: `
    SELECT q.*, r.summary, r.sources, r.error
    FROM queries q
    LEFT JOIN query_results r ON q.id = r.query_id
    WHERE q.id = ?
  `,

  deleteQuery: 'DELETE FROM queries WHERE id = ? AND user_address = ? AND status = "pending"',

  createMarketQuery: `
    INSERT INTO market_queries (market_contract_address, query_id, market_question, creator_address)
    VALUES (?, ?, ?, ?)
  `,

  getMarketByQueryId: `
    SELECT * FROM market_queries WHERE query_id = ?
  `,

  getMarketByContractAddress: `
    SELECT * FROM market_queries WHERE market_contract_address = ?
  `,
  
  updateMarketResolution: `
    UPDATE market_queries
    SET agent_resolved = TRUE,
        agent_outcome = ?,
        agent_resolution_tx = ?,
        agent_resolved_at = datetime('now'),
        agent_analysis = ?
    WHERE market_contract_address = ?
  `,

  getAllMarkets: `
    SELECT 
      mq.*,
      q.query as search_query,
      q.scheduled_for,
      q.executed_at,
      q.status,
      r.summary,
      r.sources,
      r.error
    FROM market_queries mq
    INNER JOIN queries q ON mq.query_id = q.id
    LEFT JOIN query_results r ON q.id = r.query_id
    ORDER BY mq.created_at DESC
  `
};

export interface Query {
  id: number;
  user_address: string;
  query: string;
  scheduled_for: string | null;
  executed_at: string | null;
  user_email: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  summary?: string;
  sources?: string;
  error?: string;
}

export const database = {
  async createUser(address: string) {
    await dbRun(sql.createUser, address);
  },

  async createQuery(userAddress: string, query: string, scheduledFor?: Date, userEmail?: string): Promise<number> {
    const result = await dbRun(
      sql.createQuery,
      userAddress,
      query,
      scheduledFor ? scheduledFor.toISOString() : null,
      userEmail || null,
      scheduledFor ? 'pending' : 'completed'
    );
    return result.lastID;
  },

  async getPendingQueries(userAddress: string): Promise<Query[]> {
    return await dbAll(sql.getPendingQueries, userAddress) as Query[];
  },

  async getQueryHistory(userAddress: string, limit: number = 50): Promise<Query[]> {
    return await dbAll(sql.getQueryHistory, userAddress, limit) as Query[];
  },

  async getQueriesForExecution(): Promise<Query[]> {
    return await dbAll(sql.getQueriesForExecution) as Query[];
  },

  async updateQueryStatus(queryId: number, status: Query['status']) {
    await dbRun(sql.updateQueryStatus, status, status, queryId);
  },

  async createQueryResult(queryId: number, summary: string | null, sources: any[] | null, error: string | null) {
    await dbRun(
      sql.createQueryResult,
      queryId,
      summary,
      sources ? JSON.stringify(sources) : null,
      error
    );
  },

  async getQueryById(queryId: number): Promise<Query | undefined> {
    return await dbGet(sql.getQueryById, queryId) as Query | undefined;
  },

  async deleteQuery(queryId: number, userAddress: string): Promise<boolean> {
    console.log(`Attempting to delete query: id=${queryId}, userAddress=${userAddress}`);
    const result = await dbRun(sql.deleteQuery, queryId, userAddress);
    console.log(`Delete query result: changes=${result.changes}`);
    return result.changes > 0;
  },

  async createMarketQuery(marketContractAddress: string, queryId: number, marketQuestion: string, creatorAddress: string) {
    await dbRun(sql.createMarketQuery, marketContractAddress, queryId, marketQuestion, creatorAddress);
  },

  async getMarketByQueryId(queryId: number): Promise<any | undefined> {
    return await dbGet(sql.getMarketByQueryId, queryId) as any | undefined;
  },

  async getMarketByContractAddress(marketContractAddress: string): Promise<any | undefined> {
    return await dbGet(sql.getMarketByContractAddress, marketContractAddress) as any | undefined;
  },

  async updateMarketResolution(
    marketContractAddress: string, 
    outcome: boolean, 
    txHash: string, 
    analysis: string
  ) {
    await dbRun(sql.updateMarketResolution, outcome, txHash, analysis, marketContractAddress);
  },

  async getAllMarkets(): Promise<any[]> {
    return await dbAll(sql.getAllMarkets);
  },

  close() {
    db.close();
  }
}; 