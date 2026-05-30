const fs = require('fs');
const path = require('path');

async function testPost() {
  try {
    const tokenFile = fs.readFileSync(path.join(__dirname, 'zoho-tokens.json'), 'utf8');
    const tokens = JSON.parse(tokenFile);
    const accessToken = tokens.access_token;
    
    const SHEET_ID = 's1nvw4e1999fabaf949508d49ecaf169f85c1';
    const worksheetName = 'DELTA';
    
    const url = new URL(`https://sheet.zoho.in/api/v2/${SHEET_ID}`);
    
    const params = new URLSearchParams();
    params.append('method', 'worksheet.records.add');
    params.append('worksheet_name', worksheetName);
    params.append('header_row', '1');
    params.append('json_data', JSON.stringify([{
      "Client": "PROSTOCKS",
      "Issue Subject Line": "Test Post from API",
      "Status": "Open"
    }]));
    
    console.log("Posting to:", url.toString());
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
    
  } catch (err) {
    console.error("Error:", err);
  }
}

testPost();
