import express from 'express';
const router = express.Router();
import db from '../db/connector.js';
import bcrypt from 'bcrypt';

async function initTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS pesyki (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      breed TEXT NOT NULL,
      age INTEGER NOT NULL,
      vaccinated BOOLEAN DEFAULT FALSE,
      shelter TEXT NOT NULL,
      photo TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
initTable();

function checkName(name) {
  if (!name || name.trim().length < 1) throw new Error('Invalid name: С–РјКјСЏ РЅРµ РјРѕР¶Рµ Р±СѓС‚Рё РїРѕСЂРѕР¶РЅС–Рј');
  if (name.length > 50) throw new Error('Invalid name: Р·Р°РЅР°РґС‚Рѕ РґРѕРІРіРµ');
}
function checkBreed(breed) {
  if (!breed || breed.trim().length < 1) throw new Error('Invalid breed: РїРѕСЂРѕРґР° РЅРµ РјРѕР¶Рµ Р±СѓС‚Рё РїРѕСЂРѕР¶РЅСЊРѕСЋ');
}
function checkAge(age) {
  if (!age || isNaN(age) || Number(age) < 0 || Number(age) > 30)
    throw new Error('Invalid age: РІС–Рє РјР°С” Р±СѓС‚Рё С‡РёСЃР»РѕРј РІС–Рґ 0 РґРѕ 30');
}
function checkShelter(shelter) {
  if (!shelter || shelter.trim().length < 1) throw new Error('Invalid shelter: РїСЂРёС‚СѓР»РѕРє РЅРµ РјРѕР¶Рµ Р±СѓС‚Рё РїРѕСЂРѕР¶РЅС–Рј');
}

router.get('/', async function(req, res, next) {
  const pesyki = await db.query('SELECT * FROM pesyki ORDER BY id ASC');
  const rowPesyki = pesyki.rows.map(p => ({
    ...p,
    created_at_date: p.created_at.toLocaleDateString()
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
    if (result.rowCount === 0) throw new Error(`РџРµСЃРёРєР° Р· ID ${id} РЅРµ Р·РЅР°Р№РґРµРЅРѕ`);
    res.redirect('/pesyki');
  } catch (err) {
    const pesyki = await db.query('SELECT id, name, breed FROM pesyki ORDER BY id ASC');
    res.render('pesykiForms', { pesyki: pesyki.rows, tab: 'delete', errorDelete: err.message });
  }
});

router.post('/update', async function(req, res, next) {
  const { id, name, breed, age, vaccinated, shelter, photo } = req.body;
  try {
    const result = await db.query(
      `UPDATE pesyki SET name=$1, breed=$2, age=$3, vaccinated=$4, shelter=$5, photo=$6 WHERE id=$7`,
      [name, breed, Number(age), vaccinated === 'on', shelter, photo || null, id]
    );
    if (result.rowCount === 0) throw new Error(`РџРµСЃРёРєР° Р· ID ${id} РЅРµ Р·РЅР°Р№РґРµРЅРѕ`);
    res.redirect('/pesyki');
  } catch (err) {
    const pesyki = await db.query('SELECT id, name, breed FROM pesyki ORDER BY id ASC');
    res.render('pesykiForms', { pesyki: pesyki.rows, tab: 'update', errorUpdate: err.message });
  }
});

export default router;