import express from 'express';
const router = express.Router();
import db from '../db/connector.js';

router.get('/', async function(req, res, next) {
  const students = await db.query('SELECT * FROM students');

  res.render('users', { students: students.rows || [] });
});

router.get('/create', async function(req, res, next) {
  res.render('forms/student_form');
})

router.post('/create', async function(req, res, next) {
  console.log("Submitted data: ", req.body);

  //validate input
  //add student to DB
  


  res.redirect(`/`);
})

export default router;
