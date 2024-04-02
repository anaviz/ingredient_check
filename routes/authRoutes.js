const express = require('express');
const router = express.Router();

router.get('/auth/register', (req, res) => {
  res.render('register');
});

router.post('/auth/register', (req, res) => {
  console.error('Registration functionality is currently unavailable.');
  res.status(501).send('Registration functionality is currently unavailable.');
});

router.get('/auth/login', (req, res) => {
  res.render('login');
});

router.post('/auth/login', (req, res) => {
  console.error('Login functionality is currently unavailable.');
  res.status(501).send('Login functionality is currently unavailable.');
});

router.get('/auth/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.error('Error during session destruction:', err);
        return res.status(500).send('Error logging out');
      }
      console.log('Session destroyed successfully.');
      res.redirect('/auth/login');
    });
  } else {
    console.log('No session to destroy.');
    res.redirect('/auth/login');
  }
});

module.exports = router;