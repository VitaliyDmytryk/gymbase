import express from 'express';
const router = express.Router();
import db from '../db/connector.js';
import bcrypt from 'bcrypt';

function checkName(name) {
  if (!name || name.trim().length < 1) 
    throw new Error('Імʼя не може бути порожнім');
  if (name.length > 50) 
    throw new Error('Імʼя занадто довге');
}

function checkBreed(breed) {
  if (!breed || breed.trim().length < 1) 
    throw new Error('Порода не може бути порожньою');
}

function checkAge(age) {
  if (!age || isNaN(age) || Number(age) < 0 || Number(age) > 30)
    throw new Error('Вік має бути числом від 0 до 30');
}

function checkShelter(shelter) {
  if (!shelter || shelter.trim().length < 1) 
    throw new Error('Притулок не може бути порожнім');
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
  try {
    checkName(name);
    checkBreed(breed);
    checkAge(age);
    checkShelter(shelter);
    await db.query(
      `INSERT INTO pesyki (name, breed, age, vaccinated, shelter, photo) VALUES ($1,$2,$3,$4,$5,$6)`,
      [name, breed, Number(age), vaccinated === 'on', shelter, photo || null]
    );
    res.redirect('/pesyki');
  } catch (err) {
    const pesyki = await db.query('SELECT id, name, breed FROM pesyki ORDER BY id ASC');
    console.log("err.message -> ", err.message);
    console.log("err.message.includes('name') ->", err.message.includes('name'));
    console.log("err.message -> ", err.message);
    console.log("err.message.includes('breed') ->", err.message.includes('breed'));
    console.log("err.message -> ", err.message);
    console.log("err.message.includes('age') ->", err.message.includes('age'));
    res.render('pesykiForms', {
      pesyki: pesyki.rows, tab: 'create',
      errorName: err.message.includes('name') ? err.message : null,
      errorBreed: err.message.includes('breed') ? err.message : null,
      errorAge: err.message.includes('age') ? err.message : null,
      errorShelter: err.message.includes('shelter') ? err.message : null,
      name, breed, age, shelter, photo
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
  try {
    checkName(name);
    checkBreed(breed);
    checkAge(age);
    checkShelter(shelter);
    const result = await db.query(
      `UPDATE pesyki SET name=$1, breed=$2, age=$3, vaccinated=$4, shelter=$5, photo=$6 WHERE id=$7`,
      [name, breed, Number(age), vaccinated === 'on', shelter, photo || null, id]
    );
    if (result.rowCount === 0) throw new Error(`Песика з ID ${id} не знайдено`);
    res.redirect('/pesyki');
  } catch (err) {
    const pesyki = await db.query('SELECT id, name, breed FROM pesyki ORDER BY id ASC');
    console.log("err.message -> ", err.message);
    console.log("err.message.includes('name') ->", err.message.includes('name'));
    console.log("err.message -> ", err.message);
    console.log("err.message.includes('breed') ->", err.message.includes('breed'));
    console.log("err.message -> ", err.message);
    console.log("err.message.includes('age') ->", err.message.includes('age'));
    console.log("err.message -> ", err.message);
    console.log("err.message.includes('shelter') ->", err.message.includes('shelter'));
    res.render('pesykiForms', {
      pesyki: pesyki.rows, tab: 'update',
      errorName: err.message.includes('name') ? err.message : null,
      errorBreed: err.message.includes('breed') ? err.message : null,
      errorAge: err.message.includes('age') ? err.message : null,
      errorShelter: err.message.includes('shelter') ? err.message : null,
      name, breed, age, shelter, photo
    });
  }
});

export default router;