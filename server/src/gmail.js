// Gmail scanner — searches for real estate / new construction emails
// Uses Gmail OAuth2. Set up credentials in .env (see .env.example)
const axios = require('axios');

const KEYWORDS = [
  'new construction', 'townhome', 'townhouse', 'price reduction', 'price cut',
  'move-in ready', 'model home', 'open house', 'Charlotte NC', 'Charlotte real estate',
  'DR Horton', 'Lennar', 'Ryan Homes', 'Pulte', 'Meritage', 'Eastwood Homes',
  'Smith Douglas', 'Taylor Morrison', 'Century Communities', 'Toll Brothers',
  'M/I Homes', 'Beazer', 'Stanley Martin', 'David Weekley', 'NVR',
  'Zillow alert', 'Realtor.com', 'price drop', 'quick move-in',
];

let accessToken = null;

async function getAccessToken() {
  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_REFRESH_TOKEN) {
    return null;
  }
  try {
    const resp = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    });
    accessToken = resp.data.access_token;
    return accessToken;
  } catch (err) {
    console.error('[Gmail] token error:', err.message);
    return null;
  }
}

async function searchEmails() {
  const token = await getAccessToken();
  if (!token) {
    console.log('[Gmail] No credentials configured — skipping email scan');
    return { emails: [], error: 'No Gmail credentials configured. See .env.example to set up.' };
  }

  const query = KEYWORDS.slice(0, 10).map(k => `"${k}"`).join(' OR ');
  const afterDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const gmailQuery = `(${query}) after:${Math.floor(afterDate.getTime() / 1000)} -in:spam -in:trash`;

  try {
    const listResp = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: gmailQuery, maxResults: 50 },
    });

    const messages = listResp.data.messages || [];
    const emailDetails = await Promise.allSettled(
      messages.slice(0, 20).map(m => fetchEmailDetail(m.id, token))
    );

    const emails = emailDetails
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value);

    return { emails, count: emails.length };
  } catch (err) {
    console.error('[Gmail] search error:', err.message);
    return { emails: [], error: err.message };
  }
}

async function fetchEmailDetail(messageId, token) {
  try {
    const resp = await axios.get(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { format: 'metadata', metadataHeaders: ['From', 'Subject', 'Date'] },
      }
    );

    const msg = resp.data;
    const headers = msg.payload?.headers || [];
    const getHeader = name => headers.find(h => h.name === name)?.value || '';

    const subject = getHeader('Subject');
    const from = getHeader('From');
    const date = getHeader('Date');

    // Extract price if mentioned
    const snippet = msg.snippet || '';
    const priceMatch = snippet.match(/\$[\d,]+/);
    const price = priceMatch ? parseInt(priceMatch[0].replace(/[^0-9]/g, '')) : null;

    // Extract address patterns
    const addrMatch = snippet.match(/\d+\s+[A-Z][a-z]+\s+(?:St|Ave|Rd|Dr|Ln|Blvd|Way|Ct|Pl)\b/i);

    return {
      gmail_id: messageId,
      subject,
      sender: from,
      body_snippet: snippet,
      listing_address: addrMatch ? addrMatch[0] : null,
      price,
      received_at: date,
      builder: detectBuilder(subject + ' ' + snippet),
    };
  } catch {
    return null;
  }
}

function detectBuilder(text) {
  const builders = [
    'D.R. Horton', 'DR Horton', 'Lennar', 'Ryan Homes', 'Pulte', 'Meritage',
    'Eastwood', 'Smith Douglas', 'Taylor Morrison', 'Century Communities',
    'Toll Brothers', 'M/I Homes', 'Beazer', 'Stanley Martin', 'David Weekley',
  ];
  for (const b of builders) {
    if (text.toLowerCase().includes(b.toLowerCase())) return b;
  }
  return null;
}

module.exports = { searchEmails };
