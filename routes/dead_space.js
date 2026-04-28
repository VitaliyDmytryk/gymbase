import express from 'express';
const router = express.Router();
import db from '../db/connector.js';

// Class Validation
// -------------------------------------------------------------
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = `ValidationError`;
  }
}
class Weapon {
  constructor({ name_of_gun, damage_type, damage_dealth, reload_seconds, additional_info }) {
    if (!name_of_gun) {
      throw new ValidationError("Назва зброї не може бути пустим рядком");
    } else if (!damage_type) {
      throw new ValidationError("Тип шкоди не може бути пустим рядком");
    } else if (!damage_dealth) {
      throw new ValidationError("Кількість шкоди не може бути пустим рядком");
    } else if (damage_dealth < 1) {
      throw new ValidationError("Кількість шкоди не може бути менше 1");
    } else if (damage_dealth > 20) {
      throw new ValidationError("Кількість шкоди не може бути більше 20");
    } else if (!reload_seconds) {
      throw new ValidationError("Час перезарядки не може бути пустим рядком");
    } else if (reload_seconds < 1) {
      throw new ValidationError("Час перезарядки не може бути менше 1");
    } else if (reload_seconds > 14) {
      throw new ValidationError("Час перезарядки не може бути більше 14");
    }
    this.name_of_gun = name_of_gun;
    this.damage_type = damage_type;
    this.damage_dealth = damage_dealth;
    this.reload_seconds = reload_seconds;
    this.additional_info = additional_info;
  }
}

// -------------------------------------------------------------

router.get('/', async function (req, res, next) {
  const weapon = await db.query('SELECT * FROM deadSpace');

  const modWeapons = weapon.rows.map(w => {
    return {
      ...w,
      created_at: w.created_at.toLocaleDateString()
    }
  })
  res.render('dead_space', { weapons: modWeapons || [] });
});

// Add
// -------------------------------------------------------------
router.get('/createGun', async function (req, res, next) {
  res.render('forms/dead_space_form');
})

router.post('/createGun', async function (req, res, next) {

  try {
    const ValidatedWeapon = new Weapon(req.body)
    const query = `
      INSERT INTO deadSpace (
            name_of_gun, damage_type, damage_dealth, reload_seconds, additional_info
        )
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *`;

    const result = await db.query(query, [
      ValidatedWeapon.name_of_gun,
      ValidatedWeapon.damage_type,
      ValidatedWeapon.damage_dealth,
      ValidatedWeapon.reload_seconds,
      ValidatedWeapon.additional_info,
    ]);

    res.redirect('/weapons');
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(500).send(`Помилка додавання зброї: ${err.message}`);
    }
    res.status(500).send(`Error: ${err.message}`)
  }

});

// -------------------------------------------------------------

// Edit
// -------------------------------------------------------------
router.get('/edit/:id', async function (req, res, next) {
  try {
    const { name_of_gun, damage_type, damage_dealth, reload_seconds, additional_info } = req.body;
    const result = await db.query(
      'SELECT * FROM deadSpace WHERE id = $1',
      [req.params.id]
    );

    const item = result.rows[0];

    if (!item) {
      return res.status(404).render('error', {
        message: 'Gun not found',
        error: {}
      });
    }

    res.render('dead_space', {
      title: 'Edit weapons',
      mode: 'form',
      pageTitle: 'Edit weapons',
      action: `/weapons/edit/${item.id}`,
      buttonText: 'save changes',
      item
    });

  } catch (err) {
    next(err);
  }
});

router.post('/edit/:id', async function (req, res, next) {
  try {

    const ValidatedWeapon = new Weapon(req.body)
    await db.query(
      `
      UPDATE deadSpace
      SET 
          name_of_gun = $1,
          damage_type = $2,
          damage_dealth = $3,
          reload_seconds = $4,
          additional_info = $5
      WHERE id = $6
      `,

      [
        name_of_gun,
        damage_type,
        damage_dealth,
        reload_seconds,
        additional_info,
        req.params.id
      ]
    );


    res.redirect('/weapons');
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(500).send(`Помилка додавання зброї: ${err.message}`);
    }
    res.status(500).send(`Error: ${err.message}`)
  }

  res.redirect('/weapons');


});
// -------------------------------------------------------------

// Delete
// -------------------------------------------------------------
router.get("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM deadSpace WHERE id = $1", [id]);
    res.redirect("/weapons");
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).send("Could not delete gun");
  }
});
// ------------------------------------------------------------

export default router;
