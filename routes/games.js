import express from 'express';
const router = express.Router();
import db from '../db/connector.js';

router.get('/', async function(req, res, next) {
  const games = await db.query('SELECT * FROM games_info');
  const rowGames = games.rows.map(w => {
    return {
      ...w,
      created_at: w.created_at.toLocaleDateString()
    }
  })
  res.render('games', { games: rowGames || [] });
});

router.get('/create', async function(req, res, next) {
  res.render('forms/games_form');
})

router.post('/create', async function(req, res, next) {
  console.log("Submitted data: ", req.body);

  const name = req.body.name;
  const mode = req.body.mode;
  const cost = req.body.cost
  const regexName = /^[A-Z0-9][a-zA-Z0-9\s\-:!.]*$/;
  const regexMode = /^(Online|Offline|Both)$/;
  const regexCost = /^([1-9][0-9]*[$₴]|Free)$/


if (!regexName.test(name) || !regexMode.test(mode) || !regexCost.test(cost)) {
    return res.status(400).send("Something is wrong :D");
}
    const query = `
        INSERT INTO games_info (
            game_name,
            game_mode,
            cost
        ) 
        VALUES ($1, $2, $3) 
        RETURNING *`;

    const values = [name, mode, cost];

    try {
       const res = await db.query(query, values);
       console.log('game was added:', res.rows[0]);
    } catch (err) {
        console.error('Error:', err.message);
    }
   res.redirect(`/`);

});

export default router;
