const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isValidHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

const resolvedUrl = isValidHttpUrl(supabaseUrl)
  ? supabaseUrl
  : 'https://placeholder.supabase.co';
const resolvedKey = supabaseKey || 'placeholder';

if (resolvedUrl !== supabaseUrl || resolvedKey === 'placeholder') {
  console.warn('Supabase URL or service role key is missing or invalid. File storage may not work.');
}

const supabase = createClient(resolvedUrl, resolvedKey);

module.exports = supabase;
