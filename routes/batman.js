import express from 'express';
const router = express.Router();
import db from '../db/connector.js';

const formatVillain = (villain) => ({
  ...villain,
  spotted_time: villain.spotted_at.toLocaleTimeString(),
  spotted_date: villain.spotted_at.toLocaleDateString()
});

const validateVillain = ({ threat_level }) => {
  if (Number(threat_level) < 0) {
    return 'Альфред: Рівень небезпеки не може бути від\'ємним. Навіть Пінгвін небезпечніший за нуль.';
  }
  return null;
};


router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM gotham_villains ORDER BY threat_level DESC');
    res.render('villains', { villains: rows.map(formatVillain) });
  } catch (err) {
    console.error('Бетмен: Система спостереження дала збій:', err);
    res.status(500).send('GCPD тимчасово сліпий. Комісар Гордон вже займається цим.');
  }
});


router.post('/', async (req, res) => {
  const { villain_name, location, threat_level, status } = req.body;

  const error = validateVillain({ threat_level });
  if (error) return res.status(400).send(error);

  try {
    await db.query(
      `INSERT INTO gotham_villains (villain_name, location, threat_level, status)
       VALUES ($1, $2, $3, $4)`,
      [villain_name, location, threat_level, status]
    );

    res.redirect('/villains');
  } catch (err) {
    console.error('Робін: Не вдалося внести ворога в реєстр:', err);
    res.status(500).send('Помилка при збереженні. Люциус перевіряє сервери.');
  }
});


router.get('/edit/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM gotham_villains WHERE id = $1', [req.params.id]);

    if (!rows.length) return res.status(404).send('Найтвінг: Досьє не знайдено. Ворог міг змінити локацію.');

    const allVillains = await db.query('SELECT * FROM gotham_villains ORDER BY threat_level DESC');

    res.render('villains', {
      villains: allVillains.rows.map(formatVillain),
      editingVillain: rows[0]
    });
  } catch (err) {
    console.error('Бетгерл: Помилка при відкритті досьє ворога:', err);
    res.status(500).send('Помилка сервера при завантаженні досьє.');
  }
});


router.post('/edit/:id', async (req, res) => {
  const { villain_name, location, threat_level, status } = req.body;

  const error = validateVillain({ threat_level });
  if (error) return res.status(400).send(error);

  try {
    const result = await db.query(
      `UPDATE gotham_villains SET
        villain_name = $1,
        location = $2,
        threat_level = $3,
        status = $4
       WHERE id = $5
       RETURNING *`,
      [villain_name, location, threat_level, status, req.params.id]
    );

    if (!result.rows.length) return res.status(404).send('Ворога не знайдено для оновлення.');

    res.redirect('/villains');
  } catch (err) {
    console.error('Альфред: Помилка при оновленні досьє ворога:', err);
    res.status(500).send('Помилка сервера при оновленні.');
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM gotham_villains WHERE id = $1 RETURNING villain_name',
      [req.params.id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Ворога вже немає в реєстрі.' });

    res.status(200).json({ message: `🦇 ${result.rows[0].villain_name} видалений з реєстру. Готем трохи безпечніший.` });
  } catch (err) {
    console.error('Альфред: Помилка при видаленні ворога з реєстру:', err);
    res.status(500).json({ error: 'Помилка сервера при видаленні.' });
  }
});

export default router;