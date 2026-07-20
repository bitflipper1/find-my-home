// Print the change digest:
//   npm run digest              (last 24h)
//   npm run digest -- "2026-07-18 00:00:00"
require('dotenv').config();
const { getDigest, digestText } = require('../src/digest');
console.log(digestText(getDigest(process.argv[2])));
