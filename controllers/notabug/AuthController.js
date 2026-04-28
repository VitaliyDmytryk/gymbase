import db from '../../db/connector.js';
import bcrypt from 'bcrypt';
import { NotabugDB } from './NotabugDB.js';
import { NotabugHelpers } from './NotabugHelpers.js';
import NotabugUser from '../../models/notabug/NotabugUser.js';

export class AuthController {
  static async getRegister(req, res, next) {
    try {
      const stats = await NotabugDB.getGlobalStats();
      res.render('notabug/register', {
        ...NotabugHelpers.buildBaseContext(stats),
        layout: 'layout'
      });
    } catch (err) {
      next(err);
    }
  }

  static async postRegister(req, res, next) {
    try {
      let user;
      try {
        user = new NotabugUser(req.body);
        user.validate();
      } catch (validationErr) {
        return res.status(400).render('notabug/register', {
          error: validationErr.message,
          layout: 'layout'
        });
      }

      const existing = await NotabugDB.getUserByUsername(user.username);
      if (existing) {
        return res.status(400).render('notabug/register', {
          error: 'Username already taken',
          layout: 'layout'
        });
      }

      const passwordHash = await bcrypt.hash(user.password, 10);
      await db.query(
        'INSERT INTO notabug_users (username, password_hash, email, sanity, reputation, balance) VALUES ($1, $2, $3, 100, 0, 0)',
        [user.username, passwordHash, user.email]
      );

      await NotabugDB.addFeedEvent(`<span class="user-ref">@${user.username}</span> joined the hunters`);

      res.cookie('notabug_hunter', user.username, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.redirect('/notabug');
    } catch (err) {
      next(err);
    }
  }

  static async getLogin(req, res, next) {
    try {
      const stats = await NotabugDB.getGlobalStats();
      res.render('notabug/login', {
        ...NotabugHelpers.buildBaseContext(stats),
        layout: 'layout'
      });
    } catch (err) {
      next(err);
    }
  }

  static async postLogin(req, res, next) {
    try {
      let user;
      try {
        user = new NotabugUser({ username: req.body.username, password: req.body.password });
        user.validateUsername();
        user.validatePassword();
      } catch (validationErr) {
        return res.status(400).render('notabug/login', {
          error: 'Invalid username or password',
          layout: 'layout'
        });
      }

      const record = await NotabugDB.getUserByUsername(user.username);
      if (!record) {
        return res.status(400).render('notabug/login', {
          error: 'Invalid username or password',
          layout: 'layout'
        });
      }

      const validPassword = await bcrypt.compare(user.password, record.password_hash);
      if (!validPassword) {
        return res.status(400).render('notabug/login', {
          error: 'Invalid username or password',
          layout: 'layout'
        });
      }

      res.cookie('notabug_hunter', user.username, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      const redirect = req.query.redirect || '/notabug';
      res.redirect(redirect);
    } catch (err) {
      next(err);
    }
  }

  static logout(req, res) {
    res.clearCookie('notabug_hunter');
    res.redirect('/notabug');
  }
}