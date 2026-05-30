const fs = require('fs');
const path = require('path');

async function testZoho() {
  try {
    const tokenFile = fs.readFileSync(path.join(__dirname, 'zoho-tokens.json'), 'utf8');
    const tokens = JSON.parse(tokenFile);
    const accessToken = tokens.access_token;
    
    const SHEET_ID = 's1nvw4e1999fabaf949508d49ecaf169f85c1';
    const worksheetName = 'DELTA';
    
    const url = new URL(`https://sheet.zoho.in/api/v2/${SHEET_ID}`);
    url.searchParams.append('method', 'worksheet.records.fetch');
    url.searchParams.append('worksheet_name', worksheetName);
    
    console.log("Fetching from:", url.toString());
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`
      }
    });
    
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
    
  } catch (err) {
    console.error("Error:", err);
  }
}

testZoho();
