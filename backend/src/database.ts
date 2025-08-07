import Database from 'better-sqlite3';
import path from 'path';

export interface ChatMessage {
  id?: number;
  from: string;
  text: string;
  timestamp: number;
  session_id?: string;
}

export interface GIPMessage {
  id?: number;
  gip_id: string;
  agent_id: string;
  message: string;
  message_type: string;
  impact: string;
  reasoning: string;
  timestamp: number;
}

// Database configuration
interface DatabaseConfig {
  type: 'sqlite' | 'postgresql' | 'mysql';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
}

class DatabaseManager {
  private db: Database.Database;
  private config: DatabaseConfig;

  constructor() {
    this.config = this.getDatabaseConfig();
    
    if (this.config.type === 'sqlite') {
      const dbPath = path.join(__dirname, '../data/grokchain.db');
      this.db = new Database(dbPath);
    } else if (this.config.type === 'postgresql') {
      // For now, fall back to SQLite for PostgreSQL until we implement proper PostgreSQL support
      console.log('PostgreSQL detected, but using SQLite fallback for now');
      const dbPath = path.join(__dirname, '../data/grokchain.db');
      this.db = new Database(dbPath);
    } else {
      throw new Error(`Database type ${this.config.type} not yet implemented. Please use SQLite for now.`);
    }
    
    this.initializeTables();
  }

  private getDatabaseConfig(): DatabaseConfig {
    // Check for Railway PostgreSQL
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      return {
        type: 'postgresql',
        host: url.hostname,
        port: parseInt(url.port),
        database: url.pathname.slice(1),
        username: url.username,
        password: url.password,
        ssl: url.protocol === 'postgresql+ssl:'
      };
    }

    // Check for other database URLs
    if (process.env.POSTGRES_URL) {
      const url = new URL(process.env.POSTGRES_URL);
      return {
        type: 'postgresql',
        host: url.hostname,
        port: parseInt(url.port),
        database: url.pathname.slice(1),
        username: url.username,
        password: url.password,
        ssl: url.protocol === 'postgresql+ssl:'
      };
    }

    // Default to SQLite
    return { type: 'sqlite' };
  }

  private initializeTables() {
    // Create chat messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_user TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        session_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create GIP messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS gip_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gip_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        message TEXT NOT NULL,
        message_type TEXT NOT NULL,
        impact TEXT NOT NULL,
        reasoning TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create GIPs table for persistent GIP storage
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS gips (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT NOT NULL,
        priority TEXT NOT NULL,
        summary TEXT NOT NULL,
        full_proposal TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        debate_start_time INTEGER,
        tags TEXT,
        votes TEXT
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_chat_timestamp ON chat_messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_gip_id ON gip_messages(gip_id);
      CREATE INDEX IF NOT EXISTS idx_gip_timestamp ON gip_messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_gips_status ON gips(status);
      CREATE INDEX IF NOT EXISTS idx_gips_created ON gips(created_at);
    `);
  }

  // Chat message methods
  addChatMessage(message: ChatMessage): number {
    const stmt = this.db.prepare(`
      INSERT INTO chat_messages (from_user, text, timestamp, session_id)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(message.from, message.text, message.timestamp, message.session_id || 'default');
    return result.lastInsertRowid as number;
  }

  getChatMessages(limit: number = 100, sessionId?: string): ChatMessage[] {
    const stmt = sessionId 
      ? this.db.prepare(`
          SELECT id, from_user as "from", text, timestamp, session_id
          FROM chat_messages 
          WHERE session_id = ?
          ORDER BY timestamp ASC 
          LIMIT ?
        `)
      : this.db.prepare(`
          SELECT id, from_user as "from", text, timestamp, session_id
          FROM chat_messages 
          ORDER BY timestamp ASC 
          LIMIT ?
        `);
    
    const messages = sessionId ? stmt.all(sessionId, limit) : stmt.all(limit);
    return messages as ChatMessage[];
  }

  clearChatMessages(sessionId?: string): void {
    const stmt = sessionId
      ? this.db.prepare('DELETE FROM chat_messages WHERE session_id = ?')
      : this.db.prepare('DELETE FROM chat_messages');
    
    sessionId ? stmt.run(sessionId) : stmt.run();
  }

  // GIP message methods
  addGIPMessage(message: GIPMessage): number {
    const stmt = this.db.prepare(`
      INSERT INTO gip_messages (gip_id, agent_id, message, message_type, impact, reasoning, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      message.gip_id, message.agent_id, message.message, 
      message.message_type, message.impact, message.reasoning, message.timestamp
    );
    return result.lastInsertRowid as number;
  }

  getGIPMessages(gipId: string): GIPMessage[] {
    const stmt = this.db.prepare(`
      SELECT id, gip_id, agent_id, message, message_type, impact, reasoning, timestamp
      FROM gip_messages 
      WHERE gip_id = ?
      ORDER BY timestamp ASC
    `);
    return stmt.all(gipId) as GIPMessage[];
  }

  clearGIPMessages(gipId: string): void {
    const stmt = this.db.prepare('DELETE FROM gip_messages WHERE gip_id = ?');
    stmt.run(gipId);
  }

  // GIP storage methods
  saveGIP(gip: any): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO gips (
        id, title, author, category, priority, summary, full_proposal, 
        status, created_at, updated_at, debate_start_time, tags, votes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      gip.id, gip.title, gip.author, gip.category, gip.priority,
      gip.summary, gip.fullProposal, gip.status, gip.createdAt,
      gip.updatedAt, gip.debateStartTime || null,
      JSON.stringify(gip.tags || []), JSON.stringify(gip.votes || {})
    );
  }

  getGIP(gipId: string): any {
    const stmt = this.db.prepare(`
      SELECT * FROM gips WHERE id = ?
    `);
    const result = stmt.get(gipId) as any;
    
    if (result) {
      return {
        ...result,
        tags: JSON.parse(result.tags || '[]'),
        votes: JSON.parse(result.votes || '{}'),
        debateThread: this.getGIPMessages(gipId)
      };
    }
    return null;
  }

  getAllGIPs(): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM gips ORDER BY created_at DESC
    `);
    const results = stmt.all() as any[];
    
    return results.map(result => ({
      ...result,
      tags: JSON.parse(result.tags || '[]'),
      votes: JSON.parse(result.votes || '{}'),
      debateThread: this.getGIPMessages(result.id)
    }));
  }

  close(): void {
    this.db.close();
  }

  getStats(): { chatCount: number; gipCount: number; gipMessageCount: number } {
    const chatCount = this.db.prepare('SELECT COUNT(*) as count FROM chat_messages').get() as any;
    const gipCount = this.db.prepare('SELECT COUNT(*) as count FROM gips').get() as any;
    const gipMessageCount = this.db.prepare('SELECT COUNT(*) as count FROM gip_messages').get() as any;
    
    return {
      chatCount: chatCount.count,
      gipCount: gipCount.count,
      gipMessageCount: gipMessageCount.count
    };
  }
}

// Export singleton instance
export const db = new DatabaseManager(); 