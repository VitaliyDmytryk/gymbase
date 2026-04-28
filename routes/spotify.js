import express from 'express';
const router = express.Router();
import db from '../db/connector.js';

// Головна сторінка
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM songs ORDER BY id ASC');
        res.render('spotify', { tracks: result.rows });
    } catch (err) {
        res.status(500).send("Database Error: " + err.message);
    }
});

// Форма створення
router.get('/create', (req, res) => {
    res.render('forms/spotify_form', { item: {}, isUpdate: false });
});

// Форма редагування
router.get('/update/:id', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM songs WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).send("Track not found");
        res.render('forms/spotify_form', { item: result.rows[0], isUpdate: true });
    } catch (err) {
        res.status(500).send("SQL Error: " + err.message);
    }
});

// Обробка створення
router.post('/create', async (req, res) => {
    const { title, artist, genre, duration } = req.body;
    try {
        const query = 'INSERT INTO songs (title, artist, genre, duration) VALUES ($1, $2, $3, $4)';
        await db.query(query, [title, artist, genre, duration]);
        res.redirect('/spotify');
    } catch (err) {
        // ПОМИЛКА
        res.status(500).send("❌ SQL Error: " + err.message);
    }
});

// Обробка оновлення..
router.post('/update/:id', async (req, res) => {
    const { title, artist, genre, duration } = req.body;
    try {
        const query = 'UPDATE songs SET title=$1, artist=$2, genre=$3, duration=$4 WHERE id=$5';
        await db.query(query, [title, artist, genre, duration, req.params.id]);
        res.redirect('/spotify');
    } catch (err) {
        res.status(500).send("❌ Update Error: " + err.message);
    }
});

// Видалення
router.get('/delete/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM songs WHERE id = $1', [req.params.id]);
        res.redirect('/spotify');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

export default router;