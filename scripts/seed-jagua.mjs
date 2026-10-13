import pg from 'pg';
const { Client } = pg;

const CONNECTION_STRING = "postgresql://postgres.xhcasrtzntnitsciubex:obkYry2NPAeM3AjQ@aws-0-us-east-1.pooler.supabase.com:5432/postgres";

// Coordenadas reales de barrios y sectores en La Jagua de Ibirico, Cesar
// Centro urbano: 9.5620, -73.3340
const JAGUA_BORROWERS = [
  { full_name: "Carlos López", doc: "1003266554", phone: "3105196193", addr: "Calle 5 # 8-24, Centro", lat: 9.5607606, lng: -73.3349955 },
  { full_name: "Elías Mendoza", doc: "1003255648", phone: "3215467891", addr: "Carrera 4 # 12-15, Brisas del Río", lat: 9.5725146, lng: -73.3288398 },
  { full_name: "Juan Pérez", doc: "10032554178", phone: "3001264574", addr: "Calle 3 N9-152, Toscano", lat: 9.5618080, lng: -73.3390993 },
  { full_name: "Pablo Gómez", doc: "0012345678", phone: "3221564876", addr: "Calle 5 # 8-98, El Mirador", lat: 9.5613975, lng: -73.3328147 },
  { full_name: "María Fernanda Castro", doc: "1065849302", phone: "3154829103", addr: "Carrera 7 # 4-33, San José", lat: 9.5642100, lng: -73.3361200 },
  { full_name: "Javier Eduardo Rangel", doc: "1007492019", phone: "3187293847", addr: "Calle 8 # 10-18, Barrio Obrero", lat: 9.5589000, lng: -73.3315000 },
  { full_name: "Diana Marcela Ospina", doc: "1098472910", phone: "3019283746", addr: "Carrera 2 # 6-40, Villa Prado", lat: 9.5661000, lng: -73.3402000 },
  { full_name: "Andrés Felipe Quintero", doc: "1003847291", phone: "3128394012", addr: "Calle 2 # 3-12, Los Comuneros", lat: 9.5574000, lng: -73.3384000 },
  { full_name: "Rosa Elena Beleño", doc: "39482910", phone: "3209182734", addr: "Carrera 6 # 9-45, Barrio Centro Sur", lat: 9.5630000, lng: -73.3331000 },
  { full_name: "Luis Alfonso Cárdenas", doc: "1005829102", phone: "3148291038", addr: "Calle 11 # 5-62, Sector El Carmen", lat: 9.5678000, lng: -73.3312000 },
  { full_name: "Carmen Cecilia Vega", doc: "49201928", phone: "3167482910", addr: "Carrera 8 # 7-14, Bello Horizonte", lat: 9.5598000, lng: -73.3375000 },
  { full_name: "Nelson David Meza", doc: "1002938471", phone: "3178291029", addr: "Calle 4 # 11-05, Las Delicias", lat: 9.5654000, lng: -73.3378000 }
];

async function seedJagua() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log("Connected to Supabase for seeding La Jagua de Ibirico!");

  try {
    // Clean old
    await client.query("DELETE FROM payments;");
    await client.query("DELETE FROM loans;");
    await client.query("DELETE FROM borrowers;");

    // Insert borrowers
    for (let i = 0; i < JAGUA_BORROWERS.length; i++) {
      const b = JAGUA_BORROWERS[i];
      const res = await client.query(`
        INSERT INTO borrowers (id, full_name, document_number, phone, address, city, latitude, longitude, status)
        VALUES ($1, $2, $3, $4, $5, 'La Jagua de Ibirico', $6, $7, 'active')
        RETURNING id;
      `, [i + 1, b.full_name, b.doc, b.phone, b.addr, b.lat, b.lng]);
    }
    await client.query(`SELECT setval('borrowers_id_seq', ${JAGUA_BORROWERS.length});`);
    console.log(`Inserted ${JAGUA_BORROWERS.length} borrowers with exact coordinates in La Jagua de Ibirico.`);

    // Now insert realistic microloans (montos de 200k a 1.5M, 20% interés, 15 a 30 días)
    const today = new Date().toISOString().slice(0, 10);
    const loansData = [
      { b_id: 1, amt: 500000, rate: 20, days: 30, start: '2026-10-01', paid: 8, status: 'active' },
      { b_id: 2, amt: 1000000, rate: 20, days: 15, start: '2026-10-05', paid: 6, status: 'active' },
      { b_id: 3, amt: 300000, rate: 20, days: 20, start: '2026-10-08', paid: 3, status: 'active' },
      { b_id: 4, amt: 200000, rate: 15, days: 15, start: '2026-09-15', paid: 15, status: 'completed' },
      { b_id: 5, amt: 800000, rate: 20, days: 30, start: '2026-10-02', paid: 7, status: 'active' },
      { b_id: 6, amt: 400000, rate: 20, days: 20, start: '2026-10-10', paid: 2, status: 'active' },
      { b_id: 7, amt: 600000, rate: 20, days: 30, start: '2026-10-04', paid: 5, status: 'active' },
      { b_id: 8, amt: 1500000, rate: 20, days: 30, start: '2026-10-01', paid: 10, status: 'active' },
      { b_id: 9, amt: 350000, rate: 20, days: 20, start: '2026-10-06', paid: 4, status: 'active' },
      { b_id: 10, amt: 500000, rate: 20, days: 25, start: '2026-10-07', paid: 3, status: 'active' },
      { b_id: 11, amt: 700000, rate: 20, days: 30, start: '2026-10-03', paid: 6, status: 'active' },
      { b_id: 12, amt: 250000, rate: 20, days: 15, start: '2026-10-09', paid: 2, status: 'active' }
    ];

    let paySeq = 1;
    for (let i = 0; i < loansData.length; i++) {
      const ld = loansData[i];
      const totalWithInterest = Math.round((ld.amt + (ld.amt * ld.rate / 100)) * 100) / 100;
      const daily = Math.round((totalWithInterest / ld.days) * 100) / 100;
      const totalPaid = Math.round((daily * ld.paid) * 100) / 100;

      await client.query(`
        INSERT INTO loans (id, borrower_id, amount, interest_rate, total_with_interest, daily_payment, total_days, start_date, status, total_paid, payments_made)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
      `, [i + 1, ld.b_id, ld.amt, ld.rate, totalWithInterest, daily, ld.days, ld.start, ld.status, totalPaid, ld.paid]);

      // Insert payments history for each
      for (let p = 1; p <= ld.paid; p++) {
        // compute payment date (day by day from start date)
        const d = new Date(ld.start);
        d.setDate(d.getDate() + p - 1);
        const pDate = d.toISOString().slice(0, 10);

        await client.query(`
          INSERT INTO payments (id, loan_id, borrower_id, amount, payment_date, payment_number, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
        `, [paySeq, i + 1, ld.b_id, daily, pDate, p, `Cuota #${p}`]);
        paySeq++;
      }
    }

    await client.query(`SELECT setval('loans_id_seq', ${loansData.length});`);
    await client.query(`SELECT setval('payments_id_seq', ${paySeq - 1});`);

    // Let's add 3 payments recorded TODAY (so map shows both green and blue pins!)
    // For loans 1, 3 and 7, add payment today if not already
    const todaysLoanIds = [1, 3, 7];
    for (const lid of todaysLoanIds) {
      const lRow = (await client.query("SELECT * FROM loans WHERE id = $1", [lid])).rows[0];
      await client.query(`
        INSERT INTO payments (id, loan_id, borrower_id, amount, payment_date, payment_number, notes)
        VALUES ($1, $2, $3, $4, $5, $6, 'Cobro del día de hoy');
      `, [paySeq, lid, lRow.borrower_id, lRow.daily_payment, today, lRow.payments_made + 1]);
      paySeq++;

      await client.query(`
        UPDATE loans SET total_paid = total_paid + $1, payments_made = payments_made + 1 WHERE id = $2;
      `, [lRow.daily_payment, lid]);
    }
    await client.query(`SELECT setval('payments_id_seq', ${paySeq - 1});`);

    console.log("SEEDED FULL LA JAGUA DE IBIRICO DATA!");
  } catch (e) {
    console.error("Seed error:", e);
  } finally {
    await client.end();
  }
}

seedJagua();
