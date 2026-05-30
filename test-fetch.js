const fs = require('fs');
const tokens = JSON.parse(fs.readFileSync('zoho-tokens.json', 'utf8'));

async function test() {
  // Test 1: Fetch all records (no filter)
  const url = new URL('https://sheet.zoho.in/api/v2/s1nvw4e1999fabaf949508d49ecaf169f85c1');
  url.searchParams.append('method', 'worksheet.records.fetch');
  url.searchParams.append('worksheet_name', 'DELTA');

  const r1 = await fetch(url.toString(), {
    headers: { 'Authorization': 'Zoho-oauthtoken ' + tokens.access_token }
  });
  const d1 = await r1.json();
  console.log('=== ALL RECORDS STATUS:', d1.status, 'COUNT:', d1.records_count);
  if (d1.records && d1.records.length > 0) {
    console.log('First record Client value:', JSON.stringify(d1.records[0].Client));
  }

  // Test 2: Fetch with criteria filter
  const url2 = new URL('https://sheet.zoho.in/api/v2/s1nvw4e1999fabaf949508d49ecaf169f85c1');
  url2.searchParams.append('method', 'worksheet.records.fetch');
  url2.searchParams.append('worksheet_name', 'DELTA');
  url2.searchParams.append('criteria', '("Client"="PROSTOCKS")');

  const r2 = await fetch(url2.toString(), {
    headers: { 'Authorization': 'Zoho-oauthtoken ' + tokens.access_token }
  });
  const d2 = await r2.json();
  console.log('\n=== FILTERED RECORDS (Client=PROSTOCKS) STATUS:', d2.status, 'COUNT:', d2.records_count);
  console.log('Full response:', JSON.stringify(d2, null, 2));
}

test().catch(console.error);
