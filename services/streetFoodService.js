import bcrypt from 'bcrypt';
import StreetFood from '../models/street_food.js';

class StreetFoodService {
  constructor(db) {
    this.db = db;
  }

  async getAll(user) {
    let result;

    if (user.role === 'admin') {
      result = await this.db.query(
        `SELECT * FROM street_food ORDER BY id ASC`
      );
    } else {
      result = await this.db.query(
        `SELECT * FROM street_food 
         WHERE user_id = $1 
         ORDER BY id ASC`,
        [user.id]
      );
    }

    return result.rows.map(row => new StreetFood(row));
  }

  async getById(id, user) {
    const result = await this.db.query(
      `SELECT * FROM street_food
       WHERE id = $1 AND (user_id = $2 OR $3 = 'admin')`,
      [id, user.id, user.role]
    );

    if (result.rows.length === 0) {
      throw new Error('Item not found or access denied');
    }

    return new StreetFood(result.rows[0]);
  }

  async create(data, userId) {
    const { food_name, country, spicy_level, price, rating, image_url } = data;

    const result = await this.db.query(
      `INSERT INTO street_food 
       (food_name, country, spicy_level, price, rating, image_url, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [food_name, country, spicy_level, price, rating, image_url, userId]
    );

    return new StreetFood(result.rows[0]);
  }

  async update(id, data, user) {
    const { food_name, country, spicy_level, price, rating, image_url } = data;

    const result = await this.db.query(
      `UPDATE street_food
       SET food_name=$1, country=$2, spicy_level=$3,
           price=$4, rating=$5, image_url=$6
       WHERE id=$7 AND (user_id=$8 OR $9='admin')
       RETURNING *`,
      [
        food_name,
        country,
        spicy_level,
        price,
        rating,
        image_url,
        id,
        user.id,
        user.role
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Update failed or access denied');
    }

    return new StreetFood(result.rows[0]);
  }

  async delete(id, user) {
    const result = await this.db.query(
      `DELETE FROM street_food
       WHERE id=$1 AND (user_id=$2 OR $3='admin')
       RETURNING id`,
      [id, user.id, user.role]
    );

    if (result.rows.length === 0) {
      throw new Error('Delete failed or access denied');
    }

    return true;
  }

  async findUser(login) {
    const result = await this.db.query(
      `SELECT * FROM street_food_users 
       WHERE username = $1 OR email = $1 
       LIMIT 1`,
      [login]
    );

    return result.rows[0] || null;
  }

  async createUser({ username, email, password, saltRounds }) {
    const existing = await this.db.query(
      `SELECT id FROM street_food_users 
       WHERE username = $1 OR email = $2 
       LIMIT 1`,
      [username, email]
    );

    if (existing.rows.length > 0) {
      throw new Error('Username або email вже зайнятий');
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await this.db.query(
      `INSERT INTO street_food_users 
       (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, role`,
      [username, email, passwordHash]
    );

    return result.rows[0];
  }
}

export default StreetFoodService;