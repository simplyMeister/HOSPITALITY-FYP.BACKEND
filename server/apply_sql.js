const fs = require('fs');
const { Client } = require('pg');
const path = require('path');

// ==========================================
// 1. SET YOUR PASSWORD & TARGET FILE HERE
// ==========================================
const DB_PASSWORD = 'buchionyeachonam82@gmail.com';

// The file you want to apply (relative to the root of your project)
const SQL_FILE_NAME = 'enable_realtime.sql'; 
// You can also change this to 'chat_schema.sql' or any other file!

// ==========================================

const encodedPassword = encodeURIComponent(DB_PASSWORD);
const connectionString = `postgresql://postgres.pplbqtbcqhiblgnqezvf:${encodedPassword}@aws-1-eu-central-1.pooler.supabase.com:5432/postgres`;

async function applySql() {
  if (DB_PASSWORD === 'YOUR_PASSWORD_HERE') {
    console.error('❌ ERROR: Please replace YOUR_PASSWORD_HERE with your actual Supabase database password in apply_sql.js');
    process.exit(1);
  }

  // Go up one directory to find the SQL file in the root
  const sqlFilePath = path.join(__dirname, '..', SQL_FILE_NAME);
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ ERROR: Could not find SQL file at ${sqlFilePath}`);
    process.exit(1);
  }

  console.log(`📄 Reading SQL file: ${SQL_FILE_NAME}`);
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  console.log('🔌 Connecting to Supabase database...');
  const client = new Client({
    connectionString: connectionString,
    // Required for some cloud databases
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!');
    
    console.log('⚡ Executing SQL...');
    await client.query(sqlContent);
    console.log('🎉 SQL executed successfully!');
    
  } catch (error) {
    console.error('❌ Error executing SQL:', error);
  } finally {
    await client.end();
    console.log('🔒 Connection closed.');
  }
}

applySql();
