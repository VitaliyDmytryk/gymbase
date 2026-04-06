import express from 'express';
const router = express.Router();
import db from '../db/connector.js';

const regexName = /^[A-Z0-9][a-zA-Z0-9\s\-:!._]*$/;
const regexMode = /^(Online|Offline|Both)$/;
const regexCost = /^([0-9][0-9]*[$])$/

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

if(!regexName.test(name)) {
    return res.status(400).send("Invalid game name you can use only letters, numbers, spaces and -:!._ and it should start with capital letter or number / only english letters");
}

if(!regexMode.test(mode)) {
    return res.status(400).send("Invalid game mode you can use only Online, Offline or Both you need to write it exactly like this");
}
if(!regexCost.test(cost)) {
    return res.status(400).send("Invalid game cost you can use only numbers and $ at the end!!! if game is free write 0$");
}

    const query = `
      INSERT INTO games_info (
        game_name,
        game_mode,
        cost
      ) 
      VALUES ($1, $2, $3) 
      `;

    const values = [name, mode, cost];

    try {
       const res = await db.query(query, values);
       console.log('game was added:', res.rows[0]);
    } catch (err) {
        console.error('Error:', err.message);
    }
        res.redirect(`/games`);

})

router.get('/update/:id', async function(req, res, next) {
  res.render('forms/games_form');
});

router.post('/update/:id', async function(req, res, next) {
  console.log("Submitted data: ", req.body);

  const id = req.params.id;
  const name = req.body.name;
  const mode = req.body.mode;
  const cost = req.body.cost

if(!regexName.test(name)) {
    return res.status(400).send("Invalid game name you can use only letters, numbers, spaces and -:!._ and it should start with capital letter or number / only english letters");
}

if(!regexMode.test(mode)) {
    return res.status(400).send("Invalid game mode you can use only Online, Offline or Both you need to write it exactly like this");
}
if(!regexCost.test(cost)) {
    return res.status(400).send("Invalid game cost you can use only numbers and $ at the end!!! if game is free write 0$");
}

    const query = `
      UPDATE games_info
      SET game_name = $2,
          game_mode = $3,
          cost = $4
      WHERE id = $1
      `;

    const values = [id, name, mode, cost];

try {
      const res = await db.query(query, values);
      console.log("game was updated:", res.rows[0]);
    } catch (err) {
      console.error('Error:', err.message);
    }
      res.redirect('/games'); 
});

router.get('/delete/:id', async function(req, res, next) {

  const id = req.params.id;

  const query = `
    DELETE FROM games_info
    WHERE id = $1
    `;

  const values = [id];
  
  try {
      const res = await db.query(query, values);
      console.log("game was deleted:", res.rows[0]);
    } catch (err) {
      console.error('Error:', err.message);
    }
      res.redirect('/games'); 
});

export default router;
