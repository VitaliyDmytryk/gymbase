import db from '../../db/connector.js';
import { NotabugDB } from './NotabugDB.js';
import { NotabugHelpers } from './NotabugHelpers.js';

export class DashboardController {
  static async getDashboard(req, res, next) {
    try {
      const filterStatus = req.query.status || 'all';
      let query = 'SELECT * FROM notabug_bugs';

      if (filterStatus === 'open') {
        query += " WHERE status IN ('open', 'claimed')";
      } else if (filterStatus === 'closed') {
        query += " WHERE status IN ('fixed', 'escaped')";
      }

      query += ' ORDER BY chaos_level DESC, id DESC';

      const bugsRes = await db.query(query);
      const stats = await NotabugDB.getGlobalStats();
      const feed = await NotabugDB.getFeed();
      const openBugsCount = await NotabugDB.getOpenBugsCount();
      const maxOpenBugs = NotabugHelpers.MAX_OPEN_BUGS;

      const bugs = bugsRes.rows.map(NotabugHelpers.formatBug);

      res.render('notabug/dashboard', {
        ...NotabugHelpers.buildBaseContext(stats),
        bugs,
        feed,
        filterStatus,
        openBugsCount,
        maxOpenBugs,
        canCreateNewBugs: openBugsCount < maxOpenBugs,
        layout: 'layout'
      });
    } catch (err) {
      next(err);
    }
  }
}
