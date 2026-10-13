import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xhcasrtzntnitsciubex.supabase.co',
  'sb_publishable_je8TK6wTD6Q1C2HliUmJDw_w1LtCRm-'
);

async function run() {
  const { data: b, error: e1 } = await supabase.from('borrowers').select('*');
  console.log('BORROWERS COUNT:', b ? b.length : e1);

  const { data: loans, error: e2 } = await supabase.from('loans').select('*, borrowers(*)');
  console.log('LOANS COUNT:', loans ? loans.length : e2);

  const { data: ins, error: e3 } = await supabase.from('payments').insert([{
    loan_id: 2,
    borrower_id: 2,
    amount: 80000,
    payment_date: '2026-10-13',
    payment_number: 3,
    notes: 'Prueba SDK'
  }]).select();

  console.log('INSERT RESULT:', ins, e3);
}

run();
