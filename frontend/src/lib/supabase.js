import { createClient } from '@supabase/supabase-js';

// Essas variáveis serão injetadas automaticamente pela Vercel após a integração
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://sua-url-aqui.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sua-anon-key-aqui';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
