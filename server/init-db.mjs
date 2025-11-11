import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';

async function initDb() {
  const db = await open({
    filename: './database.db',
    driver: sqlite3.Database,
  });

  // Create tables
  // await db.exec(`
  //   CREATE TABLE IF NOT EXISTS users (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     email TEXT UNIQUE,
  //     password TEXT,
  //     name TEXT
  //   );
  //   CREATE TABLE IF NOT EXISTS admins (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     username TEXT UNIQUE,
  //     password TEXT
  //   );
  //   CREATE TABLE IF NOT EXISTS judges (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     name TEXT,
  //     username TEXT UNIQUE,
  //     password TEXT,
  //     last_login DATETIME
  //   );
  //   CREATE TABLE IF NOT EXISTS judge_projects (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     judge_id INTEGER NOT NULL,
  //     description TEXT,
  //     pdf_path TEXT,
  //     status TEXT DEFAULT 'PENDING',
  //     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  //     updated_at DATETIME,
  //     decision_at DATETIME,
  //     final_score INTEGER,
  //     evaluation TEXT,
  //     FOREIGN KEY (judge_id) REFERENCES judges(id)
  //   );
  //   CREATE TABLE IF NOT EXISTS ideas (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     user_id INTEGER,
  //     contact_email TEXT,
  //     submitter_full_name TEXT,
  //     track TEXT,
  //     phone TEXT,
  //     team_members TEXT,
  //     idea_title TEXT,
  //     executive_summary TEXT,
  //     file_path TEXT,
  //     submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  //     FOREIGN KEY (user_id) REFERENCES users(id)
  //   );
  // `);

  // Seed default admin accounts if not present
  const existingAdmin1 = await db.get(`SELECT id FROM admins WHERE username = ?`, ["admin1"]);
  if (!existingAdmin1) {
    await db.run(`INSERT INTO admins (username, password) VALUES (?, ?)`, ["admin1", "adm!23"]);
  }else{

    // update admin user password
    await db.run(
      `UPDATE admins SET password = ? WHERE username = ?`,
      ["adm!23", "admin1"]
    );
    
    // change admin user username
    // await db.run(
    //   `UPDATE admins SET username = ? WHERE username = ?`,
    //   ["newAdmin", "admin1"]
    // );
  
    // Delete admin user
    // await db.run(
    //   `DELETE FROM admins WHERE username = ?`,
    //   ["admin1"]
    // );
  }

  const existingAdmin2 = await db.get(`SELECT id FROM admins WHERE username = ?`, ["admin2"]);
  if (existingAdmin2) {
     // Delete admin user
    await db.run(
      `DELETE FROM admins WHERE username = ?`,
      ["admin2"]
    );
  }

  const DrKarimi = await db.get(`SELECT id FROM admins WHERE username = ?`, ["RasoulKarimi"]);
  if (!DrKarimi) {
    await db.run(`INSERT INTO admins (username, password) VALUES (?, ?)`, ["RasoulKarimi", "dr!2345"]);
  }


  // const existingAdmin3 = await db.get(`SELECT id FROM admins WHERE username = ?`, ["dabirElmi"]);
  // if (!existingAdmin3) {
  //   await db.run(`INSERT INTO admins (username, password) VALUES (?, ?)`, ["dabirElmi", "12345678"]);
  // }

  await db.close();
}

initDb().then(() => console.log('Database initialized'));