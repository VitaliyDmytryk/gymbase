import db from '../../db/connector.js';
import { NotabugDB } from './NotabugDB.js';
import { NotabugHelpers } from './NotabugHelpers.js';

export class BugController {
  static async getBug(req, res, next) {
    try {
      const bug = await NotabugDB.getBugById(req.params.id);
      if (!bug) return res.status(404).render('error', { message: 'Bug not found', error: {} });

      const mutations = await NotabugDB.getMutationsByBugId(bug.id);
      const stats = await NotabugDB.getGlobalStats();

      res.render('notabug/bug', {
        ...NotabugHelpers.buildBaseContext(stats),
        bug: NotabugHelpers.formatBug(bug),
        mutations,
        layout: 'layout'
      });
    } catch (err) {
      next(err);
    }
  }

  static async #renderBugWithError(res, bug, mutations, stats, validationError) {
    res.render('notabug/bug', {
      ...NotabugHelpers.buildBaseContext(stats),
      bug: NotabugHelpers.formatBug(bug),
      mutations: mutations || [],
      validationError,
      layout: 'layout'
    });
  }

  static async postClaim(req, res, next) {
    try {
      const bugId = parseInt(req.params.id);
      if (isNaN(bugId)) return res.redirect('/notabug');

      const hunter = req.user ? req.user.username : req.body.hunter;
      if (!hunter) {
        return res.status(401).redirect('/notabug/login?redirect=' + encodeURIComponent(req.originalUrl));
      }

      const bug = await NotabugDB.getBugById(bugId);
      if (!bug) return res.status(404).redirect('/notabug');

      const stats = await NotabugDB.getGlobalStats();

      if (bug.status !== 'open') {
        return BugController.#renderBugWithError(res, bug, [], stats, `Cannot claim bug! Status is: ${bug.status}`);
      }

      if (bug.claimed_by === hunter) {
        return BugController.#renderBugWithError(res, bug, [], stats, 'You already claimed this bug!');
      }

      await db.query(
        'UPDATE notabug_bugs SET status = $1, claimed_by = $2 WHERE id = $3',
        ['claimed', hunter, bugId]
      );

      const user = await NotabugDB.ensureUser(hunter);
      await db.query(
        'UPDATE notabug_users SET sanity = GREATEST(sanity - 5, 0) WHERE id = $1',
        [user.id]
      );

      await NotabugDB.addMutation(bugId, 'Claimed by ' + hunter);
      await NotabugDB.addFeedEvent(`<span class="user-ref">@${hunter}</span> claimed <span class="bug-ref">bug #${bugId}</span>`);

      res.redirect('/notabug/bug/' + bugId);
    } catch (err) {
      next(err);
    }
  }

  static async postFix(req, res, next) {
    try {
      const bugId = parseInt(req.params.id);
      if (isNaN(bugId)) return res.redirect('/notabug');

      const hunter = req.user ? req.user.username : req.body.hunter;
      if (!hunter) {
        return res.status(401).redirect('/notabug/login?redirect=' + encodeURIComponent(req.originalUrl));
      }

      const bug = await NotabugDB.getBugById(bugId);
      if (!bug) return res.status(404).redirect('/notabug');

      const stats = await NotabugDB.getGlobalStats();

      if (bug.claimed_by !== hunter) {
        return BugController.#renderBugWithError(res, bug, [], stats, 'You did not claim this bug!');
      }

      if (bug.status !== 'claimed') {
        return BugController.#renderBugWithError(res, bug, [], stats, `Cannot fix bug! Status is: ${bug.status}`);
      }

      const user = await NotabugDB.ensureUser(hunter);
      const outcome = BugController.#rollFixOutcome(bug.severity);

      await BugController.#applyFixOutcome(outcome, bug, bugId, hunter, user.id);

      res.redirect('/notabug/bug/' + bugId + '?outcome=' + outcome);
    } catch (err) {
      next(err);
    }
  }

  static #rollFixOutcome(severity) {
    const chance = NotabugHelpers.SEVERITY_CHANCES[severity] || 0.5;
    const roll = Math.random();
    if (roll < chance) return 'success';
    if (roll > 0.92) return 'catastrophe';
    return 'fail';
  }

  static async #applyFixOutcome(outcome, bug, bugId, hunter, userId) {
    if (outcome === 'success') {
      const newChaos = Math.max(0, bug.chaos_level - 15);
      await db.query('UPDATE notabug_bugs SET status = $1, chaos_level = $2 WHERE id = $3', ['fixed', newChaos, bugId]);

      const bountyAmount = bug.bounty || 50;
      await db.query(
        'UPDATE notabug_users SET reputation = reputation + 10, balance = balance + $1, bugs_fixed = bugs_fixed + 1, sanity = GREATEST(sanity - 8, 0) WHERE id = $2',
        [bountyAmount, userId]
      );

      await NotabugDB.addMutation(bugId, 'Fixed by ' + hunter);
      await NotabugDB.addFeedEvent(`<span class="success-ref">✓ Bug #${bugId} fixed</span> by <span class="user-ref">@${hunter}</span> | Bounty: $${bountyAmount}`);
    } else if (outcome === 'catastrophe') {
      const newChaos = Math.min(100, bug.chaos_level + 25);
      await db.query('UPDATE notabug_bugs SET chaos_level = $1, severity = $2 WHERE id = $3', [newChaos, 'critical', bugId]);

      const newBugRes = await db.query(
        'INSERT INTO notabug_bugs (title, description, severity, chaos_level, status, bounty) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        ['Splinter of #' + bugId, 'Spawned from a failed fix attempt on bug #' + bugId, 'high', 60, 'open', 50]
      );

      await db.query(
        'UPDATE notabug_users SET sanity = GREATEST(sanity - 20, 0), bugs_failed = bugs_failed + 1, balance = GREATEST(balance - 25, 0) WHERE id = $1',
        [userId]
      );

      await NotabugDB.addMutation(bugId, 'Fix attempt catastrophically failed. New bug spawned.');
      await NotabugDB.addFeedEvent(`<span class="chaos-ref">💥 Fix failed on #${bugId} — new bug #${newBugRes.rows[0].id} spawned</span>`);
    } else {
      const newChaos = Math.min(100, bug.chaos_level + 10);
      await db.query('UPDATE notabug_bugs SET chaos_level = $1 WHERE id = $2', [newChaos, bugId]);

      await db.query(
        'UPDATE notabug_users SET sanity = GREATEST(sanity - 8, 0), bugs_failed = bugs_failed + 1, reputation = GREATEST(reputation - 2, 0) WHERE id = $1',
        [userId]
      );

      await NotabugDB.addMutation(bugId, 'Fix attempt failed.');
      await NotabugDB.addFeedEvent(`Fix attempt on <span class="bug-ref">#${bugId}</span> failed. Chaos rising.`);
    }
  }
}
