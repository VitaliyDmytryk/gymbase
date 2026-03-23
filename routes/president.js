import express from 'express';
const router = express.Router();
import db from '../db/connector.js';

router.get('/', async function(req, res, next) {
  const president = await db.query('SELECT * FROM presidents');
  const rowPresident = president.rows.map(s => {
    return {
      ...s,
      created_at_time: s.created_at.toLocaleTimeString(), 
      created_at_date: s.created_at.toLocaleDateString()
    }
  })

  res.render('president', { president: rowPresident || [] });
});

export default router;
