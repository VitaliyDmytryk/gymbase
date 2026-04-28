import db from '../../db/connector.js';
import { NotabugDB } from './NotabugDB.js';
import { NotabugHelpers } from './NotabugHelpers.js';

export class ProfileController {
  static async getProfile(req, res, next) {
    try {
      const username = req.params.username;

      const userRes = await db.query(
        'SELECT id, username, sanity, reputation, balance, bugs_fixed, bugs_failed, created_at FROM notabug_users WHERE username = $1',
        [username]
      );

      if (!userRes.rows.length) {
        return res.status(404).render('error', { message: 'Hunter not found', error: {} });
      }

      const user = userRes.rows[0];

      const activeBugsRes = await db.query(
        'SELECT id, title, severity, chaos_level, bounty FROM notabug_bugs WHERE claimed_by = $1 AND status = $2 LIMIT 10',
        [username, 'claimed']
      );

      const stats = await NotabugDB.getGlobalStats();
      const sanityVal = user.sanity || 100;

      res.render('notabug/profile', {
        ...NotabugHelpers.buildBaseContext(stats),
        user: {
          ...user,
          sanityClass: NotabugHelpers.sanitizeClass(sanityVal),
          sanityEffect: NotabugHelpers.sanitizeEffect(sanityVal),
          sanityPct: sanityVal
        },
        activeBugs: activeBugsRes.rows,
        isOwnProfile: req.user && req.user.id === user.id,
        layout: 'layout'
      });
    } catch (err) {
      next(err);
    }
  }
}
