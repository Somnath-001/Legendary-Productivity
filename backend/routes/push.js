import express from 'express';
import webpush from 'web-push';

const router = express.Router();

// Configure VAPID keys from environment for security
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn('[push] VAPID keys are not set. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env');
}

// In-memory subscription store (for demo/dev). Replace with DB in production.
const subscriptions = new Set();

router.get('/public-key', (req, res) => {
  if (!VAPID_PUBLIC_KEY) return res.status(500).json({ error: 'VAPID_PUBLIC_KEY not configured' });
  return res.json({ publicKey: VAPID_PUBLIC_KEY });
});

router.post('/subscribe', (req, res) => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: 'VAPID keys not configured on server' });
  }
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }
  subscriptions.add(subscription);
  return res.json({ ok: true });
});


router.post('/unsubscribe', (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }
  // Remove matching endpoint if present
  for (const sub of subscriptions) {
    if (sub.endpoint === subscription.endpoint) {
      subscriptions.delete(sub);
      break;
    }
  }
  return res.json({ ok: true });
});

router.post('/test', async (req, res) => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: 'VAPID keys not configured on server' });
  }
  try {
    const payload = JSON.stringify({
      title: 'Test Push',
      body: 'This is a test push notification from the server.',
    });

    // If client passes a subscription, use that; else, send to all known
    const target = req.body && req.body.subscription ? [req.body.subscription] : Array.from(subscriptions);
    if (target.length === 0) return res.status(400).json({ error: 'No subscriptions available' });

    const results = [];
    for (const sub of target) {
      try {
        await webpush.sendNotification(sub, payload);
        results.push({ endpoint: sub.endpoint, ok: true });
      } catch (err) {
        results.push({ endpoint: sub.endpoint, ok: false, error: err.message });
      }
    }
    return res.json({ ok: true, results });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Push send failed' });
  }
});

export default router;


