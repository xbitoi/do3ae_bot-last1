const fs = require('fs');
const settings = JSON.parse(fs.readFileSync('artifacts/api-server/settings.json', 'utf8'));

async function run() {
  const refreshToken = settings.youtubeToken;
  const clientId = settings.youtubeClientId;
  const clientSecret = settings.youtubeClientSecret;
  
  console.log("clientId:", clientId);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });
  const data = await res.json();
  console.log("Refresh response:", data);

  if (data.access_token) {
    const chRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true", {
        headers: { Authorization: `Bearer ${data.access_token}`, Accept: "application/json" }
    });
    console.log("Channel response:", chRes.status, await chRes.json());
  }
}
run();
