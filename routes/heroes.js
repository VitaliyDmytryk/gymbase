import express from 'express';
const router = express.Router();
import db from '../db/connector.js';

// Створення класу  
class HeroData {
  constructor({ id, name, primary_attribute, role, attack_type, created_at }) {
    this.id = id;
    this.name = name || "Unknown";
    this.primary_attribute = primary_attribute || "Unknown";
    this.role = role || "Unknown";
    this.attack_type = attack_type || "Unknown";
    
    // Зберігаємо оригінальне поле на всяк випадок
    this.created_at = created_at; 
    
    // Форматуємо дату та час так (в стаса пілглянув)
    this.created_at_time = created_at ? new Date(created_at).toLocaleTimeString('uk-UA') : '';
    this.created_at_date = created_at ? new Date(created_at).toLocaleDateString('uk-UA') : '';
  }

  // Метод для дебагу в консолі 
  display() {
    console.log(`\n--- [HERO: ${this.name.toUpperCase()}] ---`);
    console.table({
      "Id": this.id,
      "Attribute": this.primary_attribute,
      "Role": this.role,
      "Attack Type": this.attack_type,
      "Time": this.created_at_time,
      "Date": this.created_at_date
    });
    console.log("-----------------------");
  }
}
// --------------------

router.get('/', async function(req, res, next) {
  try {
    const heroes = await db.query('SELECT * FROM heroes ORDER BY id ASC');
    
    const rowheroes = heroes.rows.map(row => new HeroData(row));
    
    res.render('heroes', { heroes: rowheroes || [] });
  } catch (err) {
    console.error("Помилка отримання даних:", err.message);
    res.status(500).send("Database Error");
  }
});

router.get("/add", (req, res) => {
  res.render("forms/heroes_form", { isEdit: false });
});

router.post("/add", async (req, res) => {
  try {
    const { hero_name, hero_class, hero_role, attack_type } = req.body;

    const query = `
      INSERT INTO heroes (name, primary_attribute, role, attack_type)
      VALUES ($1, $2, $3, $4)
    `;

    await db.query(query, [
      hero_name || "Unknown",
      hero_class || "Unknown", 
      hero_role || "Unknown",
      attack_type || "Unknown" 
    ]);
    res.redirect("/heroes"); 
  } catch (err) {
    console.error("DATABASE ERROR:", err.message);
    res.status(500).send("Database Error: " + err.message);
  }
});

router.get("/edit/:id", async (req, res) => {
  try {
    const heroId = req.params.id;
    const result = await db.query('SELECT * FROM heroes WHERE id = $1', [heroId]);
    
    if (result.rows.length === 0) {
      return res.status(404).send("Hero not found");
    }

    const hero = new HeroData(result.rows[0]);

    res.render("forms/heroes_form", { 
      isEdit: true, 
      hero: hero 
    });
  } catch (err) {
    console.error("Помилка бази даних:", err.message);
    res.status(500).send("Database Error: " + err.message);
  }
});

router.post("/edit/:id", async (req, res) => {
  try {
    const heroId = req.params.id;
    const { hero_name, hero_class, hero_role, attack_type } = req.body;

    const query = `
      UPDATE heroes 
      SET name = $1, primary_attribute = $2, role = $3, attack_type = $4
      WHERE id = $5
    `;

    await db.query(query, [
      hero_name, 
      hero_class, 
      hero_role, 
      attack_type, 
      heroId
    ]);
    res.redirect("/heroes"); 
  } catch (err) {
    console.error("Помилка оновлення:", err.message);
    res.status(500).send("Database Error: " + err.message);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const heroId = req.params.id;
    await db.query('DELETE FROM heroes WHERE id = $1', [heroId]);
    res.sendStatus(200);
  } catch (err) {
    console.error("Помилка при видаленні:", err.message);
    res.status(500).send("Database Error: " + err.message);
  }
});

export default router;
