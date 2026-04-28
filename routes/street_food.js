import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import { getNames } from 'country-list';

import db from '../db/connector.js';
import StreetFoodService from '../services/streetFoodService.js';

const router = express.Router();
const service = new StreetFoodService(db);

const SALT_ROUNDS = 10;
const countries = getNames().sort((a, b) => a.localeCompare(b));

router.use(
  session({
    secret: 'street-food-secret',
    resave: false,
    saveUninitialized: false
  })
);

function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.redirect('/street_food/index');
  }
  next();
}

function formatFoodData(rows) {
  return (rows || []).map((item) => {
    const date = new Date(item.created_at);

    return {
      ...item,
      formatted_created_at: new Intl.DateTimeFormat('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date),
      formatted_price:
        item.price != null ? `$${Number(item.price).toFixed(2)}` : '—'
    };
  });
}

function buildFormView({
  title,
  pageTitle,
  action,
  buttonText,
  item = {},
  fieldErrors = {}
}) {
  return {
    title,
    isForm: true,
    pageTitle,
    action,
    buttonText,
    item,
    countries: JSON.stringify(countries),
    fieldErrors
  };
}

router.get('/index', async (req, res, next) => {
  try {
    const foods = await service.getAll({ role: 'admin' });

    res.render('forms/street_food/street_food_index', {
      title: 'Welcome!',
      food: formatFoodData(foods),
      user: req.session?.user || null
    });
  } catch (err) {
    next(err);
  }
});

router.get('/login', (req, res) => {
  if (req.session?.user) return res.redirect('/street_food');

  res.render('forms/street_food/street_food_login', {
    title: 'Street Food Login',
    item: {},
    fieldErrors: {}
  });
});

router.post('/login', async (req, res, next) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.render('forms/street_food/street_food_login', {
        title: 'Street Food Login',
        item: req.body,
        fieldErrors: { login: 'Заповніть всі поля' }
      });
    }

    const user = await service.findUser(login);

    if (!user) {
      return res.render('forms/street_food/street_food_login', {
        title: 'Street Food Login',
        item: req.body,
        fieldErrors: { login: 'Користувача не знайдено' }
      });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.render('forms/street_food/street_food_login', {
        title: 'Street Food Login',
        item: req.body,
        fieldErrors: { password: 'Невірний пароль' }
      });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    res.redirect('/street_food');
  } catch (err) {
    next(err);
  }
});

router.get('/register', (req, res) => {
  if (req.session?.user) return res.redirect('/street_food');

  res.render('forms/street_food/street_food_register', {
    title: 'Street Food Register',
    item: {},
    fieldErrors: {}
  });
});

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const user = await service.createUser({
      username,
      email,
      password,
      saltRounds: SALT_ROUNDS
    });

    req.session.user = user;

    res.redirect('/street_food');
  } catch (err) {
    res.render('forms/street_food/street_food_register', {
      title: 'Street Food Register',
      item: req.body,
      fieldErrors: { username: err.message }
    });
  }
});

router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.redirect('/street_food/index');
  });
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const foods = await service.getAll(req.session.user);

    res.render('forms/street_food/street_food', {
      title: 'Street Food',
      isForm: false,
      food: formatFoodData(foods),
      user: req.session.user
    });
  } catch (err) {
    next(err);
  }
});

router.get('/new', requireAuth, (req, res) => {
  res.render(
    'forms/street_food/street_food',
    buildFormView({
      title: 'Add food',
      pageTitle: 'Add new food',
      action: '/street_food/create',
      buttonText: 'Create food'
    })
  );
});

router.post('/create', requireAuth, async (req, res, next) => {
  try {
    await service.create(req.body, req.session.user.id);
    res.redirect('/street_food');
  } catch (err) {
    res.render(
      'forms/street_food/street_food',
      buildFormView({
        title: 'Add food',
        pageTitle: 'Add new food',
        action: '/street_food/create',
        buttonText: 'Create food',
        item: req.body,
        fieldErrors: { general: err.message }
      })
    );
  }
});

router.get('/edit/:id', requireAuth, async (req, res, next) => {
  try {
    const item = await service.getById(req.params.id, req.session.user);

    if (!item) return res.redirect('/street_food');

    res.render(
      'forms/street_food/street_food',
      buildFormView({
        title: 'Edit food',
        pageTitle: 'Edit food',
        action: `/street_food/update/${item.id}`,
        buttonText: 'Save changes',
        item
      })
    );
  } catch (err) {
    next(err);
  }
});

router.post('/update/:id', requireAuth, async (req, res, next) => {
  try {
    await service.update(req.params.id, req.body, req.session.user);
    res.redirect('/street_food');
  } catch (err) {
    next(err);
  }
});

router.post('/delete/:id', requireAuth, async (req, res, next) => {
  try {
    await service.delete(req.params.id, req.session.user);
    res.redirect('/street_food');
  } catch (err) {
    next(err);
  }
});

export default router;