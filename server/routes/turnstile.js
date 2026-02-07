const express = require('express');
const router = express.Router();

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

// POST /api/verify-turnstile - Verifikasi Turnstile token
router.post('/verify-turnstile', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token tidak ditemukan' });
    }

    // Verifikasi ke Cloudflare
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: req.ip
      })
    });

    const data = await response.json();

    if (data.success) {
      res.json({ success: true, message: 'Verifikasi berhasil' });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Verifikasi gagal',
        codes: data['error-codes']
      });
    }
  } catch (err) {
    console.error('[Turnstile] Verification error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
