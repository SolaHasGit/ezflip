const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Public image bucket on supabase 
const BUCKET_NAME = 'ezflip-images';

// Get the authenticated user from a bearer token
async function getUserFromToken(token) {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return { user, error };
}

module.exports = {
  supabase,
  BUCKET_NAME,
  getUserFromToken
};
