import express from 'express';
const router = express.Router();
import db from '../db/connector.js'; 


const formatKittens = (rows) => {
  return rows.map(kitten => ({
    ...kitten,
    created_at_time: kitten.created_at ? new Date(kitten.created_at).toLocaleTimeString('uk-UA') : '-',
    created_at_date: kitten.created_at ? new Date(kitten.created_at).toLocaleDateString('uk-UA') : '-'
  }));
};

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM kittens ORDER BY id ASC');
    const formattedKittens = formatKittens(rows);

    res.render('kittens', { kittens: formattedKittens });
  } catch (error) {
    console.error('Помилка при завантаженні кошенят:', error);
    res.status(500).send('Помилка сервера при завантаженні бази кошенят');
  }
});

router.post('/', async (req, res) => {
  const { name, breed, color, fur_type, energy_level } = req.body;

   if (!name) {
    return res.status(400).send("Помилка: ім'я обовязкове")};
  if (energy_level && (energy_level <0 || energy_level > 100)){
    return res.status(400).send("Помилка: енергія повинна бути від 0 до 100")};

  try {
    await db.query(
      `INSERT INTO kittens (name, breed, color, fur_type, energy_level) 
       VALUES ($1, $2, $3, $4, $5)`,
      [name, breed, color, fur_type, energy_level || 0]
    );
    res.redirect('/kittens'); 
  } catch (error) {
    console.error('Помилка при створенні кошеняти:', error);
    res.status(500).send('Помилка при збереженні в базу даних');
  }
});

router.get('/edit/:id', async (req, res) => {
  const kittenId = req.params.id;
  
  try {
    const kittenResult = await db.query('SELECT * FROM kittens WHERE id = $1', [kittenId]);
    
    if (kittenResult.rows.length === 0) {
      return res.status(404).send('Кошеня не знайдено в базі');
    }

    const allKittens = await db.query('SELECT * FROM kittens ORDER BY id ASC');
    const formattedKittens = formatKittens(allKittens.rows);

    res.render('kittens', { 
      kittens: formattedKittens, 
      editingKitten: kittenResult.rows[0] 
    });
  } catch (error) {
    console.error('Помилка при завантаженні кошеняти для редагування:', error);
    res.status(500).send('Помилка сервера');
  }
});


router.post('/edit/:id', async (req, res) => {
  const kittenId = req.params.id;
  const { name, breed, color, fur_type, energy_level } = req.body;

  if (!name) {
    return res.status(400).send("Помилка: ім'я обовязкове")};
  if (energy_level && (energy_level <0 || energy_level > 100)){
    return res.status(400).send("Помилка: енергія повинна бути від 0 до 100")};

  try {
    await db.query(
      `UPDATE kittens SET 
        name = $1, breed = $2, color = $3, fur_type = $4, energy_level = $5
       WHERE id = $6`,
      [name, breed, color, fur_type, energy_level || 0, kittenId]
    );
    res.redirect('/kittens');
  } catch (error) {
    console.error('Помилка при оновленні профілю кошеняти:', error);
    res.status(500).send('Помилка сервера при оновленні');
  }
});


router.get('/delete/:id', async (req, res) => {
  const kittenId = req.params.id;

  try {
    await db.query('DELETE FROM kittens WHERE id = $1', [kittenId]);
    res.redirect('/kittens');
  } catch (error) {
    console.error('Помилка при видаленні кошеняти:', error);
    res.status(500).send('Не вдалося видалити запис з бази даних');
  }
});

export default router;