import { NotabugDB } from './NotabugDB.js';

export class NotabugMiddleware {
  static async loadUser(req, res, next) {
    const hunterName = req.cookies.notabug_hunter;
    if (hunterName) {
      try {
        const userRes = await NotabugDB.getUserByUsername(hunterName);
        if (userRes) {
          req.user = userRes;
        }
      } catch (err) {
        console.error('User load error:', err);
      }
    }
    res.locals.user = req.user || null;
    next();
  }
}
