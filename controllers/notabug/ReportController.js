import db from '../../db/connector.js';
import { NotabugDB } from './NotabugDB.js';
import { NotabugHelpers } from './NotabugHelpers.js';
import NotabugBug from '../../models/notabug/NotabugBug.js';

export class ReportController {
  static async getReport(req, res, next) {
    try {
      const stats = await NotabugDB.getGlobalStats();
      res.render('notabug/report', {
        ...NotabugHelpers.buildBaseContext(stats),
        layout: 'layout'
      });
    } catch (err) {
      next(err);
    }
  }

  static async postReport(req, res, next) {
    try {
      const openBugsCount = await NotabugDB.getOpenBugsCount();

      if (openBugsCount >= NotabugHelpers.MAX_OPEN_BUGS) {
        const stats = await NotabugDB.getGlobalStats();
        return res.status(429).render('notabug/report', {
          ...NotabugHelpers.buildBaseContext(stats),
          error: `System capacity reached! ${openBugsCount}/${NotabugHelpers.MAX_OPEN_BUGS} open bugs. Cannot create new bugs until some are fixed or escape.`,
          layout: 'layout'
        });
      }

      let bug;
      try {
        bug = new NotabugBug(req.body);
        bug.validate();
      } catch (validationErr) {
        const stats = await NotabugDB.getGlobalStats();
        return res.status(400).render('notabug/report', {
          ...NotabugHelpers.buildBaseContext(stats),
          error: validationErr.message,
          layout: 'layout'
        });
      }

      const chaos = Math.floor(Math.random() * 60) + 10;
      const unstable = Math.random() > 0.6;

      const params = bug.toInsertParams();

      if (Math.random() > 0.7) {
        params[1] = (params[1] || '') + ' [SYSTEM: description altered by entropy daemon]';
      }

      const result = await db.query(
        'INSERT INTO notabug_bugs (title, description, severity, bounty, steps_to_reproduce, chaos_level, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [...params, chaos, 'open']
      );

      const bugId = result.rows[0].id;
      await NotabugDB.addMutation(bugId, 'Bug reported');

      if (unstable) {
        await NotabugDB.addMutation(bugId, 'Marked as unstable by system');
      }

      await NotabugDB.addFeedEvent(`New bug <span class="bug-ref">#${bugId}</span> reported: <span class="highlight">${bug.title}</span>`);

      res.redirect('/notabug/bug/' + bugId);
    } catch (err) {
      next(err);
    }
  }
}