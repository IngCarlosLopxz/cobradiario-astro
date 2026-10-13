import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xhcasrtzntnitsciubex.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_je8TK6wTD6Q1C2HliUmJDw_w1LtCRm-';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
