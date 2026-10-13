import pg from 'pg';
const { Client } = pg;

const CONNECTION_STRING = "postgresql://postgres.xhcasrtzntnitsciubex:obkYry2NPAeM3AjQ@aws-0-us-east-1.pooler.supabase.com:5432/postgres";

async function migrate() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log("Connected to Supabase PostgreSQL!");

  try {
    // 1. Create tables
    console.log("Creating tables...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS borrowers (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        document_number VARCHAR(30),
        phone VARCHAR(30),
        address VARCHAR(255),
        city VARCHAR(100),
        latitude NUMERIC(10, 7),
        longitude NUMERIC(10, 7),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS loans (
        id SERIAL PRIMARY KEY,
        borrower_id INTEGER NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
        amount NUMERIC(12, 2) NOT NULL,
        interest_rate NUMERIC(5, 2) NOT NULL,
        total_with_interest NUMERIC(12, 2) NOT NULL,
        daily_payment NUMERIC(12, 2) NOT NULL,
        total_days INTEGER NOT NULL,
        start_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted')),
        total_paid NUMERIC(12, 2) DEFAULT 0.00,
        payments_made INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
        borrower_id INTEGER NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
        amount NUMERIC(12, 2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_number INTEGER,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- Enable RLS and public access or grant permissions
      ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;
      ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
      ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

      -- Allow anon and authenticated full access for testing
      DROP POLICY IF EXISTS "Public full access borrowers" ON borrowers;
      CREATE POLICY "Public full access borrowers" ON borrowers FOR ALL USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Public full access loans" ON loans;
      CREATE POLICY "Public full access loans" ON loans FOR ALL USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Public full access payments" ON payments;
      CREATE POLICY "Public full提示 full access payments" ON payments;
      CREATE POLICY "Public full access payments" ON payments FOR ALL USING (true) WITH CHECK (true);
    `);

    console.log("Tables created successfully!");

    // 2. Check if data exists
    const checkB = await client.query('SELECT COUNT(*) FROM borrowers');
    if (parseInt(checkB.rows[0].count) === 0) {
      console.log("Seeding data from cobradiario.sql...");

      // Insert borrowers
      await client.query(`
        INSERT INTO borrowers (id, full_name, document_number, phone, address, city, latitude, longitude, status, created_at) VALUES
        (1, 'Carlos Lopez', '1003266554', '3105196193', 'calle 5 123', 'la jagua', 9.5607606, -73.3349955, 'active', '2026-04-24 17:23:56'),
        (2, 'elias', '1003255648', '321546789', 'calle 1 la jagua', 'la jagua', 9.5725146, -73.3288398, 'active', '2026-04-24 17:40:05'),
        (3, 'Juan Perez', '10032554178', '3001264574', 'calle 3 N9-152 toscano', 'La Jagua de Ibirico, Cesar, Colombia', 9.5618080, -73.3390993, 'active', '2026-04-28 15:22:26'),
        (4, 'pablo g', '0012345678', '3221564876', 'calle 5 #8-98 la jagua', 'La Jagua de Ibirico, Cesar, RAP Caribe, Colombia', 9.5613975, -73.3328147, 'active', '2026-04-28 19:39:34');
        SELECT setval('borrowers_id_seq', 4);
      `);

      // Insert loans
      await client.query(`
        INSERT INTO loans (id, borrower_id, amount, interest_rate, total_with_interest, daily_payment, total_days, start_date, status, total_paid, payments_made, created_at) VALUES
        (1, 1, 499999.99, 20.00, 599999.99, 20000.00, 30, '2026-04-24', 'completed', 619000.00, 8, '2026-04-24 17:24:21'),
        (2, 2, 1000000.00, 20.00, 1200000.00, 80000.00, 15, '2026-04-24', 'active', 160000.00, 2, '2026-04-24 17:41:05'),
        (3, 1, 200000.00, 15.00, 230000.00, 15333.33, 15, '2026-04-27', 'active', 15333.33, 1, '2026-04-27 02:43:48'),
        (4, 3, 100000.00, 20.00, 120000.00, 4000.00, 30, '2026-04-28', 'active', 0.00, 0, '2026-04-28 15:25:58'),
        (5, 4, 100000.00, 20.00, 120000.00, 4000.00, 30, '2026-04-28', 'active', 0.00, 0, '2026-04-28 19:39:54');
        SELECT setval('loans_id_seq', 5);
      `);

      // Insert payments
      await client.query(`
        INSERT INTO payments (id, loan_id, borrower_id, amount, payment_date, payment_number, notes, created_at) VALUES
        (1, 1, 1, 20000.00, '2026-04-24', 1, NULL, '2026-04-24 17:24:54'),
        (2, 1, 1, 20000.00, '2026-04-24', 2, NULL, '2026-04-24 17:25:17'),
        (3, 1, 1, 20000.00, '2026-04-24', 3, NULL, '2026-04-24 17:25:23'),
        (4, 1, 1, 20000.00, '2026-04-24', 4, NULL, '2026-04-24 17:25:35'),
        (5, 1, 1, 20000.00, '2026-04-24', 5, NULL, '2026-04-24 17:25:40'),
        (6, 1, 1, 20000.00, '2026-04-24', 6, NULL, '2026-04-24 17:25:44'),
        (7, 1, 1, 479000.00, '2026-04-24', 7, NULL, '2026-04-24 17:26:04'),
        (8, 1, 1, 20000.00, '2026-04-24', 8, NULL, '2026-04-24 17:26:08'),
        (9, 2, 2, 80000.00, '2026-04-24', 1, NULL, '2026-04-24 17:41:28'),
        (10, 2, 2, 80000.00, '2026-04-27', 2, NULL, '2026-04-27 02:46:03'),
        (11, 3, 1, 15333.33, '2026-04-27', 1, NULL, '2026-04-27 02:46:10');
        SELECT setval('payments_id_seq', 11);
      `);
      console.log("Initial seed data inserted into Supabase!");
    } else {
      console.log(`Borrowers already exist (${checkB.rows[0].count} records). Skipping seed.`);
    }

    const testSelect = await client.query('SELECT count(*) as b_cnt FROM borrowers');
    const testLoans = await client.query('SELECT count(*) as l_cnt FROM loans');
    const testPay = await client.query('SELECT count(*) as p_cnt FROM payments');
    console.log("Current Supabase Counts:", {
      borrowers: testSelect.rows[0].b_cnt,
      loans: testLoans.rows[0].l_cnt,
      payments: testPay.rows[0].p_cnt
    });

  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

migrate();
