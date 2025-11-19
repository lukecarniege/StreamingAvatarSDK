// POST /api/create-session
// Serverless function (Vercel). DO NOT include your API key in this file.
// Set HEYGEN_API_KEY in Vercel Project -> Settings -> Environment Variables.

import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { avatarId, userId, origin, options } = req.body || {};

    const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
    const HEYGEN_API_BASE = process.env.HEYGEN_API_BASE || 'https://api.heygen.com';

    if (!HEYGEN_API_KEY) {
      return res.status(500).json({ error: 'Server not configured with HEYGEN_API_KEY' });
    }

    const payload = {
      avatar_id: avatarId || 'default-avatar',
      meta: { user_id: userId || 'anonymous' },
      interactive: true,
      allowed_origins: origin ? [origin] : undefined,
      options: options || {}
    };

    const providerUrl = `${HEYGEN_API_BASE}/v1/interactive_sessions`;

    const result = await axios.post(providerUrl, payload, {
      headers: {
        Authorization: `Bearer ${HEYGEN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });

    const data = result.data || {};
    const sessionUrl = data.session_url || data.url || data.embed_url || null;
    const expiresAt = data.expires_at || data.expires_in || null;

    if (!sessionUrl) {
      console.error('Unexpected provider response', data);
      return res.status(502).json({ error: 'Provider did not return a session URL' });
    }

    res.status(200).json({ sessionUrl, expiresAt });
  } catch (err) {
    console.error('create-session error', err?.response?.data || err.message || err);
    const status = err?.response?.status || 500;
    const body = err?.response?.data || { error: err.message || 'unknown' };
    res.status(status).json(body);
  }
}
