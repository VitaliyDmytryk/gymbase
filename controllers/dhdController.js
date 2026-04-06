import db from '../db/connector.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
export async function registerHousewife(username, password_hash, season, reason, character_notes) {
  try {
    const hash = await bcrypt.hash(password_hash, SALT_ROUNDS);
    const query = `
      INSERT INTO desperate_housewives_1 (username, password_hash, season, reason, character_notes)
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`;
    const res = await db.query(query, [username, hash, season, reason, character_notes]);
    
    console.log(`✓ Character registered successfully: @${res.rows[0].username}`);
    return res.rows[0];
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function deleteHousewife(username, password) {
  const res = await db.query('SELECT * FROM desperate_housewives_1 WHERE username = $1', [username]);
  if (res.rows.length === 0) {
    throw new Error('No housewife found');
  }

  const dhd = res.rows[0];
  const isMatch = await bcrypt.compare(password, dhd.password_hash);
  
  if (isMatch) {
    await db.query('DELETE FROM desperate_housewives_1 WHERE username = $1', [username]);
    console.log(`✓ The character @${username} has been removed.`);
    return true;
  } else {
    throw new Error('Invalid password');
  }
}

export async function updateHousewife(id, currentUsername, password, updateData) {
  const res = await db.query('SELECT * FROM desperate_housewives_1 WHERE id = $1', [id]);
  
  if (res.rows.length === 0) {
    throw new Error('Character not found');
  }

  const dhd = res.rows[0];

  const isMatch = await bcrypt.compare(password, dhd.password_hash);
  if (!isMatch) {
    throw new Error('Invalid password');
  }

  const fields = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(updateData)) {
    if (value && value !== '' && key !== 'password') { 
      fields.push(`${key} = $${index}`);
      values.push(value);
      index++;
    }
  }

  if (fields.length === 0) {
    throw new Error('No data provided for update');
  }

  values.push(id);
  const query = `UPDATE desperate_housewives_1 SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`;

  const updateRes = await db.query(query, values);
  return updateRes.rows[0];
}

export function checkPassword(password) {
const passwordInput = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*]).*$/;
  if (password.length < 8) {
    throw new Error('Password need to have 8 or more symbols')
  } else if (!passwordInput.test(password)) {
    throw new Error("The password must contain at least one uppercase letter, one lowercase letter, a number and a special character.");
  }
}

export function checkSeason(season) {
  if (season < 0 || season > 8) {
    throw new Error ("The season cannot be negative or more than 8, because there are only 8 season T_T")
  }
}

  export function checkUsername(username) {
  const hasLetter = /[a-zA-Z]/.test(username); 

    if (!hasLetter) {
      throw new Error("The username must contain at least one letter");
    }
  }

  export function checkReason(reason) {
  const hasLetter = /[a-zA-Z]/.test(reason); 

    if (!hasLetter) {
      throw new Error("The reason must contain at least one letter");
    }
    if (hasLetter.length > 100) {
        throw new Error("The reason can't be more than 100")
    }
  }

  export function checkNotes(note) {
  const hasLetter = /[a-zA-Z]/.test(note); 

    if (!hasLetter) {
      throw new Error("The character notes must contain at least one letter");
    }
  }