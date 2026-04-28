import db from '../../db/connector.js';

export class NotabugDB {
  static async getGlobalStats() {
    const chaos = await db.query(
      "SELECT AVG(chaos_level)::int as avg FROM notabug_bugs WHERE status != $1",
      ['escaped']
    );
    const hunters = await db.query(
      'SELECT COUNT(*)::int as cnt FROM notabug_users WHERE is_active = true'
    );
    const sanity = await db.query(
      'SELECT AVG(sanity)::int as avg FROM notabug_users WHERE is_active = true'
    );
    return {
      chaosLevel: chaos.rows[0].avg || 0,
      activeHunters: hunters.rows[0].cnt || 0,
      globalSanity: sanity.rows[0].avg || 100
    };
  }

  static async getFeed(limit = 20) {
    const res = await db.query(
      'SELECT * FROM notabug_feed ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return res.rows.map(r => ({
      ...r,
      timeStr: r.created_at.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }));
  }

  static async addFeedEvent(msg) {
    await db.query('INSERT INTO notabug_feed (message) VALUES ($1)', [msg]);
  }

  static async getBugById(id) {
    const res = await db.query('SELECT * FROM notabug_bugs WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async getMutationsByBugId(bugId) {
    const res = await db.query(
      'SELECT * FROM notabug_mutations WHERE bug_id = $1 ORDER BY created_at ASC',
      [bugId]
    );
    return res.rows.map(m => ({
      ...m,
      timeStr: m.created_at.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }));
  }

  static async addMutation(bugId, description) {
    await db.query(
      'INSERT INTO notabug_mutations (bug_id, description) VALUES ($1, $2)',
      [bugId, description]
    );
  }

  static async getUserByUsername(username) {
    const res = await db.query(
      'SELECT * FROM notabug_users WHERE username = $1',
      [username]
    );
    return res.rows[0] || null;
  }

  static async getOpenBugsCount() {
    const res = await db.query(
      "SELECT COUNT(*)::int as count FROM notabug_bugs WHERE status IN ('open', 'claimed')"
    );
    return res.rows[0].count;
  }

  static async ensureUser(username) {
    let user = await this.getUserByUsername(username);
    if (!user) {
      const res = await db.query(
        'INSERT INTO notabug_users (username, password_hash) VALUES ($1, $2) RETURNING *',
        [username, 'nohash']
      );
      user = res.rows[0];
    }
    return user;
  }
}
