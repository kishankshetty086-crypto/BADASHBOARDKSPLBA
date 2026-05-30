const fs = require('fs');
const tokens = JSON.parse(fs.readFileSync('zoho-tokens.json', 'utf8'));

const DELTA_SHEET = '28sgs78c4e56fc87845a3a6432dd20ce00c4e';
const ALPHA_SHEET = 'fjzrna35928cca34c40beab718601a1b1ec7f';

async function fetchSheet(sheetId, worksheetName) {
  const url = new URL(`https://sheet.zoho.in/api/v2/${sheetId}`);
  url.searchParams.append('method', 'worksheet.records.fetch');
  url.searchParams.append('worksheet_name', worksheetName);

  const res = await fetch(url.toString(), {
    headers: { 'Authorization': 'Zoho-oauthtoken ' + tokens.access_token }
  });
  return res.json();
}

async function listWorksheets(sheetId) {
  const url = new URL(`https://sheet.zoho.in/api/v2/${sheetId}`);
  url.searchParams.append('method', 'workbook.info');

  const res = await fetch(url.toString(), {
    headers: { 'Authorization': 'Zoho-oauthtoken ' + tokens.access_token }
  });
  return res.json();
}

async function main() {
  console.log('=== DELTA - GEPL sheet ===');
  const gepl = await fetchSheet(DELTA_SHEET, 'GEPL');
  console.log('Status:', gepl.status, '| Count:', gepl.records_count);
  if (gepl.records && gepl.records.length > 0) {
    console.log('Columns:', Object.keys(gepl.records[0]));
    console.log('First record:', JSON.stringify(gepl.records[0], null, 2));
  } else {
    console.log('Response:', JSON.stringify(gepl, null, 2));
  }

  console.log('\n=== DELTA - PROSTOCKS sheet ===');
  const pro = await fetchSheet(DELTA_SHEET, 'PROSTOCKS');
  console.log('Status:', pro.status, '| Count:', pro.records_count);
  if (pro.records && pro.records.length > 0) {
    console.log('Columns:', Object.keys(pro.records[0]));
    console.log('First record:', JSON.stringify(pro.records[0], null, 2));
  } else {
    console.log('Response:', JSON.stringify(pro, null, 2));
  }
}

main().catch(console.error);

