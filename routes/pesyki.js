import express from 'express';
const router = express.Router();
import db from '../db/connector.js';
import bcrypt from 'bcrypt';

function checkName(name) {
  if (!name || name.trim().length < 1) return 'Імʼя не може бути порожнім';
  if (name.length > 50) return 'Імʼя занадто довге';
  return null;
}

function checkBreed(breed) {
  if (!breed || breed.trim().length < 1) return 'Порода не може бути порожньою';
  return null;
}

function checkAge(age) {
  if (age === undefined || age === null || age === '' || isNaN(Number(age)) || Number(age) < 0 || Number(age) > 30) return 'Вік має бути числом від 0 до 30';
  return null;
}

function checkShelter(shelter) {
  if (!shelter || shelter.trim().length < 1) return 'Притулок не може бути порожнім';
  return null;
}

function formatDateToDDMMYYYY(date) {
  return date.toLocaleDateString('en-GB');
}

router.get('/', async function(req, res, next) {
  const pesyki = await db.query('SELECT * FROM pesyki ORDER BY id ASC');
  const rowPesyki = pesyki.rows.map(p => ({
    ...p,
    created_at_date: formatDateToDDMMYYYY(p.created_at)
  }));
  res.render('pesyki', { pesyki: rowPesyki || [] });
});

router.get('/forms', async function(req, res, next) {
  const pesyki = await db.query('SELECT id, name, breed FROM pesyki ORDER BY id ASC');
  res.render('pesykiForms', { pesyki: pesyki.rows, tab: req.query.tab || 'create' });
});

router.post('/create', async function(req, res, next) {
  const { name, breed, age, vaccinated, shelter, photo } = req.body;
  const errorName = checkName(name);
  const errorBreed = checkBreed(breed);
  const errorAge = checkAge(age);
  const errorShelter = checkShelter(shelter);

  if (errorName || errorBreed || errorAge || errorShelter) {
    const pesyki = await db.query('SELECT id, name, breed FROM pesyki ORDER BY id ASC');
    return res.render('pesykiForms', {
      pesyki: pesyki.rows,
      tab: 'create',
      errorName,
      errorBreed,
      errorAge,
      errorShelter,
      name,
      breed,
      age,
      shelter,
      photo
    });
  }

  try {
    await db.query(
      `INSERT INTO pesyki (name, breed, age, vaccinated, shelter, photo) VALUES ($1,$2,$3,$4,$5,$6)`,
      [name, breed, Number(age), vaccinated === 'on', shelter, photo || null]
    );
    res.redirect('/pesyki');
  } catch (err) {
    const pesyki = await db.query('SELECT id, name, breed FROM pesyki ORDER BY id ASC');
    res.render('pesykiForms', {
      pesyki: pesyki.rows,
      tab: 'create',
      errorName: err.message.includes('name') ? err.message : null,
      errorBreed: err.message.includes('breed') ? err.message : null,
      errorAge: err.message.includes('age') ? err.message : null,
      errorShelter: err.message.includes('shelter') ? err.message : null,
      name,
      breed,
      age,
      shelter,
      photo
    });
  }
});

router.post('/delete', async function(req, res, next) {
  const { id } = req.body;
  try {
    const result = await db.query('DELETE FROM pesyki WHERE id = $1', [id]);
    if (result.rowCount === 0) throw new Error("Песика з ID ${id} не знайдено");
    res.redirect('/pesyki');
  } catch (err) {
    const pesyki = await db.query('SELECT id, name, breed FROM pesyki ORDER BY id ASC');
    res.render('pesykiForms', { pesyki: pesyki.rows, tab: 'delete', errorDelete: err.message });
  }
});

router.post('/update', async function(req, res, next) {
  const { id, name, breed, age, vaccinated, shelter, photo } = req.body;
  const errorName = checkName(name);
  const errorBreed = checkBreed(breed);
  const errorAge = checkAge(age);
  const errorShelter = checkShelter(shelter);

  if (errorName || errorBreed || errorAge || errorShelter) {
    const pesyki = await db.query('SELECT id, name, breed FROM pesyki ORDER BY id ASC');
    return res.render('pesykiForms', {
      pesyki: pesyki.rows,
      tab: 'update',
      errorName,
      errorBreed,
      errorAge,
      errorShelter,
      name,
      breed,
      age,
      shelter,
      photo
    });
  }

  try {
    const result = await db.query(
      `UPDATE pesyki SET name=$1, breed=$2, age=$3, vaccinated=$4, shelter=$5, photo=$6 WHERE id=$7`,
      [name, breed, Number(age), vaccinated === 'on', shelter, photo || null, id]
    );
    if (result.rowCount === 0) throw new Error(`Песика з ID ${id} не знайдено`);
    res.redirect('/pesyki');
  } catch (err) {
    const pesyki = await db.query('SELECT id, name, breed FROM pesyki ORDER BY id ASC');
    res.render('pesykiForms', {
      pesyki: pesyki.rows,
      tab: 'update',
      errorName: err.message.includes('name') ? err.message : null,
      errorBreed: err.message.includes('breed') ? err.message : null,
      errorAge: err.message.includes('age') ? err.message : null,
      errorShelter: err.message.includes('shelter') ? err.message : null,
      name,
      breed,
      age,
      shelter,
      photo
    });
  }
});

export default router;