import { createClient } from '@supabase/supabase-js';

const s = createClient(
  'https://xhcasrtzntnitsciubex.supabase.co',
  'sb_secret_IMVNv6ByxzYSKmdKJeNm5g_DcMTn_mz'
);

async function clean() {
  const { data, error } = await s.from('payments').delete().in('id', [12, 13]);
  console.log('CLEANED:', data, error);
}

clean();
