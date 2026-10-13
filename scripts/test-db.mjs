import pg from 'pg';
const { Client } = pg;

async function testConn() {
  const connectionStrings = [
    // Direct
    "postgresql://postgres:obkYry2NPAeM3AjQ@db.xhcasrtzntnitsciubex.supabase.co:5432/postgres",
    // Pooler Transaction (Session) 5432
    "postgresql://postgres.xhcasrtzntnitsciubex:obkYry2NPAeM3AjQ@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
    // Pooler 6543
    "postgresql://postgres.xhcasrtzntnitsciubex:obkYry2NPAeM3AjQ@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
  ];

  for (const conn of connectionStrings) {
    console.log("Trying:", conn.replace(/:obkYry2NPAeM3AjQ@/, ':***@'));
    const client = new Client({
      connectionString: conn,
      ssl: { rejectUnauthorized: false }
    });
    try {
      await client.connect();
      const res = await client.query('SELECT current_database(), now();');
      console.log('SUCCESS! Connected:', res.rows);
      await client.end();
      return conn;
    } catch (e) {
      console.error('Failed:', e.message);
      try { await client.end(); } catch(_) {}
    }
  }
}

testConn();
