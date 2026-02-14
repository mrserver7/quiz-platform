import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vtncpvksdgiacoqrydih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bmNwdmtzZGdpYWNvcXJ5ZGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMDc5MjgsImV4cCI6MjA4NjU4MzkyOH0.eblRk2klcLpm3HBWviEN49Zpwu89wU6JKzwumC_YMK8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
