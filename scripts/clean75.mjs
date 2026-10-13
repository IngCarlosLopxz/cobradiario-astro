import { createClient } from '@supabase/supabase-js';
const s = createClient('https://xhcasrtzntnitsciubex.supabase.co', 'sb_secret_IMVNv6ByxzYSKmdKJeNm5g_DcMTn_mz');
s.from('payments').delete().eq('id', 75).then(() => console.log('CLEANED 75'));
