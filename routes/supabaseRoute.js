const express = require('express');
const supabase = require('../services/supabaseService');
const router = express.Router();

// Register new user with metadata
router.post('/register', async (req, res) => {
  const { email, password, username, display_name } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name
      }
    }
  });

  if (error) return res.status(400).json({ message: error.message });

  res.status(201).json({ user: data.user });
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) return res.status(400).json({ message: error.message });

  res.status(200).json({
    message: 'Login successful',
    user: data.user,
    session: data.session
  });
});

// Check session validity 
router.get('/me', async (req, res) => {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ message: 'Missing token' });
  
    const { data: { user }, error } = await supabase.auth.getUser(token);
  
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  
    res.status(200).json({ user });
  });

module.exports = router;
