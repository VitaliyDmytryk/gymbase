import express from "express"
const router = express.Router();
import db from "../db/connector.js";
import { registerHousewife, deleteHousewife, updateHousewife, checkPassword, checkReason, checkUsername, checkSeason} from "../controllers/dhdController.js";


router.get('/', async function(req, res, next) {
  const dhd = await db.query('SELECT * FROM desperate_housewives_1');

  const modDhd = dhd.rows.map(w => {
    return {
      ...w,
      created_at: w.created_at.toLocaleDateString()
    }
  })
  res.render('dhd', { dhd: modDhd || [] });
});


router.get('/addHousewife', function(req, res) {
  res.render('forms/dhd/dhd_form', { 
    username: '', season: '', reason: '', character_notes: '' 
  });
});

router.post('/addHousewife', async function(req, res) {
  console.log("Submitted data: ", req.body);

  const { username, password_hash, season, reason, character_notes } = req.body;

  try {
    await registerHousewife(username, password_hash, season, reason, character_notes);
    res.redirect('/dhd');
  } catch (err) {
    console.error("Registration Error:", err.message);
    res.status(500).render('forms/dhd/dhd_form', {
      ErrorPassword: "Wrong login or password",
      username, season, reason, character_notes 
    });
  }
});


router.get('/delete/:id', async function(req, res, next) {
  res.render('forms/dhd/dhd_delete', {
    id: req.params.id,
    action: `/dhd/delete`
  });
})

router.post('/delete', async function(req, res, next) {
  const { username, password } = req.body; 

  try {
    await deleteHousewife(username, password);
    res.redirect('/dhd');
  } catch (err) {
    if (err.message === 'Invalid password') {
      res.status(403).send('Invalid password');
    } else {
      res.status(500).send(`!! Error deleting housewife: ${username}`);
    }
  }
});

router.get('/update/:id', async function(req, res) {
  const id = req.params.id;
  try {
    const result = await db.query('SELECT * FROM desperate_housewives_1 WHERE id = $1', [id]);
    const housewife = result.rows[0];

    if (!housewife) {
      return res.status(404).send("No Character");
    }

    res.render('forms/dhd/dhd_update', { 
      housewife: housewife,
      action: `/dhd/update/${id}` 
    }); 
  } catch(err) {
    res.status(500).send("Error (")
    }
  });

router.post('/update/:id', async (req, res) => {
  const id = req.params.id; 
  
  const { currentUsername, password, newUsername, newSeason, new_reason, new_notes } = req.body;
  
  const updateData = {
    username: newUsername,
    season: newSeason ? parseInt(newSeason) : null,
    reason: new_reason,
    character_notes: new_notes
  };

  try {
    await updateHousewife(id, currentUsername, password, updateData);
    res.redirect('/dhd');
  } catch (err) {
    if (err.message === 'Character not found') {
      res.status(404).send('Error: No character with this name');
    } else if (err.message === 'Invalid password') {
      res.status(403).send('Wrong password');
    } else {
      res.status(500).send('Server error');
    }
  }
});


export default router;
