const fs = require('fs');
const tokens = JSON.parse(fs.readFileSync('zoho-tokens.json', 'utf8'));

async function refreshToken() {
  const params = new URLSearchParams();
  params.append('client_id', '1000.TUXOQJKV4SLSCH7BXUQBHEV1YAJ05R');
  params.append('client_secret', '13e6cd8c2f64df6e319b8a5fa30ab349b4ee563ca6');
  params.append('refresh_token', tokens.refresh_token);
  params.append('grant_type', 'refresh_token');

  const res = await fetch('https://accounts.zoho.in/oauth/v2/token', {
    method: 'POST',
    body: params
  });

  const data = await res.json();
  console.log('Refresh response:', JSON.stringify(data, null, 2));

  if (data.access_token) {
    // Save new token
    const updated = {
      ...tokens,
      access_token: data.access_token,
      expires_at: Date.now() + (data.expires_in * 1000)
    };
    fs.writeFileSync('zoho-tokens.json', JSON.stringify(updated, null, 2));
    console.log('\n✅ Token refreshed and saved!');
  } else {
    console.log('\n❌ Failed to refresh token');
  }
}

refreshToken().catch(console.error);
