const fs = require('fs');
const tokens = JSON.parse(fs.readFileSync('zoho-tokens.json', 'utf8'));

async function fetchMeetingSheet() {
  const url = new URL('https://sheet.zoho.in/api/v2/jya2s39a66749153b430f9bded679f180392b');
  url.searchParams.append('method', 'worksheet.records.fetch');
  url.searchParams.append('worksheet_name', 'DELTA');

  const res = await fetch(url.toString(), {
    headers: { 'Authorization': 'Zoho-oauthtoken ' + tokens.access_token }
  });
  const data = await res.json();
  console.log('Status:', data.status, '| Records:', data.records_count);
  if (data.records && data.records.length > 0) {
    console.log('\nColumn keys from first record:');
    Object.keys(data.records[0]).forEach(k => console.log(' -', k));
    console.log('\nFirst record sample:', JSON.stringify(data.records[0], null, 2));
  } else {
    console.log('Full response:', JSON.stringify(data, null, 2));
  }
}

fetchMeetingSheet().catch(console.error);
