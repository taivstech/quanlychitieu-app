const mysql = require('mysql2/promise');

async function fixCharset() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'taiteasicale',
    database: 'quanlychitieu'
  });

  try {
    await connection.query(`ALTER DATABASE quanlychitieu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    const [tables] = await connection.query(`SHOW TABLES`);
    
    for (const row of tables) {
      const tableName = Object.values(row)[0];
      await connection.query(`ALTER TABLE ${tableName} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`Converted table ${tableName} to utf8mb4`);
    }
    
    console.log("Database encoding fixed successfully!");
  } catch (error) {
    console.error("Error fixing database charset:", error);
  } finally {
    await connection.end();
  }
}

fixCharset();
