import express from 'express';
const router = express.Router();
import db from '../db/connector.js';

function validateName(name) {
  if (!name || name.length < 2) return false;
  if (!/^[A-Za-zA-Яа-яІіЇїЄє]/.test(name)) return false;
  if (!/^[A-Za-zA-Яа-яIiЇїЄє0-9\s\-:.!]+$/.test(name)) return false;
  return true;
}

function validateAge(age) {
  const num = Number(age);
  return !isNaN(num) && num >= 0 && num <= 150;
}

function validateCountry(country) {
  if (!country || country.length < 2) return false;
  if (!/^[A-Za-zA-Яа-яІіЇїЄє]/.test(country)) return false;
  if (!/^[A-Za-zA-Яа-яIiЇїЄє0-9\s\-:.!]+$/.test(country)) return false;
  return true;
}

router.get('/', async (req, res, next) => {
  try {
    const president = await db.query('SELECT * FROM president');
    const rowpresident = president.rows.map(p => ({
      ...p,
         created_at: p.created_at.toLocaleDateString()
    }));
    res.render('president', { president: rowpresident });
  } catch (err) {
    next(err);
  }
});

router.get('/create', (req, res) => {
  res.render('forms/president_form', { action: '/president/create', president: {} });
});

router.post('/create', async (req, res, next) => {
  const name = req.body.name?.trim();
  const age = req.body.age;
  const country = req.body.country?.trim();
  if (!validateName(name) || !validateAge(age) || !validateCountry(country)) {
    return res.status(400).send("Validation failed");
  }
  try {
    await db.query('INSERT INTO president (name, age, country) VALUES ($1, $2, $3)', [name, age, country]);
    res.redirect('/president');
  } catch (err) {
    next(err);
  }
});

router.get('/update/:id', async (req, res, next) => {
  res.render('forms/president_form')
});

router.post('/update/:id', async (req, res, next) => {
  const id = req.params.id;
  const name = req.body.name?.trim();
  const age = req.body.age;
  const country = req.body.country?.trim();

  function validateName(name) {
  if (!name || name.length < 2) return false;
  if (!/^[A-Za-zA-Яа-яІіЇїЄє]/.test(name)) return false;
  if (!/^[A-Za-zA-Яа-яIiЇїЄє0-9\s\-:.!]+$/.test(name)) return false;
  return true;
}

function validateAge(age) {
  const num = Number(age);
  return !isNaN(num) && num >= 0 && num <= 150;
}

function validateCountry(country) {
  if (!country || country.length < 2) return false;
  if (!/^[A-Za-zA-Яа-яІіЇїЄє]/.test(country)) return false;
  if (!/^[A-Za-zA-Яа-яIIЇїЄє0-9\s\-:.!]+$/.test(country)) return false;
  return true;
}
  
  if (!validateName(name) || !validateAge(age) || !validateCountry(country)) {
    return res.status(400).send("Validation failed");
  }

 const query = `
      UPDATE president
      SET name = $2,
          age = $3,
          country = $4
      WHERE id = $1
      RETURNING*`;

    const values = [id, name, age, country];

try {
      const res = await db.query(query, values);
      console.log("president was updated:", res.rows[0]);
    } catch (err) {
      console.error('Error:', err.message);
    }
      res.redirect('/president'); 
});
router.get('/delete/:id', async function(req, res, next) {

  const id = req.params.id;

  const query = `
    DELETE FROM president 
    WHERE id = $1
    RETURNING*`;

  const values = [id];
  
  try {
      const res = await db.query(query, values);
      console.log("president  was deleted:", res.rows[0]);
    } catch (err) {
      console.error('Error:', err.message);
    }
      res.redirect('/president'); 
});
export default router;