
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
dotenv.config();

const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;
const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
const user = process.env.MAIL_USER;

console.log('--- Debugging Gmail API ---');
console.log(`Client ID: ${clientId?.slice(0, 10)}...`);
console.log(`Client Secret: ${clientSecret?.slice(0, 5)}...`);
console.log(`Refresh Token: ${refreshToken?.slice(0, 10)}...`);
console.log(`User: ${user}`);

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: refreshToken,
});

async function testConnection() {
  try {
    const accessTokenResponse = await oauth2Client.getAccessToken();
    console.log('✅ Access Token retrieved successfully!');
    console.log(`Access Token: ${accessTokenResponse.token?.slice(0, 10)}...`);

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    console.log('✅ Gmail Profile retrieved successfully!');
    console.log(`Email Address: ${profile.data.emailAddress}`);

    if (profile.data.emailAddress !== user) {
        console.warn(`⚠️ WARNING: Authenticated user (${profile.data.emailAddress}) does not match MAIL_USER (${user})`);
    }

  } catch (error: any) {
    console.error('❌ Authentication Failed:', error.message);
    if (error.response) {
        console.error('Error Response Data:', JSON.stringify(error.response.data, null, 2));
    } else {
        console.error('Full Error Object:', error);
    }
  }
}

testConnection();
