
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function main() {
  try {
      // 1. Login
      console.log('Logging in...');
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
          email: 'faculty@gatherly.com',
          password: 'password123'
      });
      const token = loginRes.data.access_token;
      console.log('Login successful.');

      // 2. Get Club ID
      const club = await prisma.club.findFirst();
      if (!club) {
          console.error('No clubs found in DB. Please create one first via UI or seed.');
          return;
      }
      console.log(`Using Club ID: ${club.id}`);

      // 3. Upload Attempt
      console.log('Attempting upload request...');
      try {
          const res = await axios.post(`${API_URL}/resources`, {
              title: 'Test Resource',
              description: 'Testing',
              clubId: String(club.id),
              type: 'PDF'
          }, {
              headers: { Authorization: `Bearer ${token}` }
          });
          console.log('Response Status:', res.status);
      } catch (error: any) {
          console.log('Request Failed!');
          if (error.response) {
              console.log(`Status: ${error.response.status}`);
              console.log('Body:', JSON.stringify(error.response.data));
          } else {
              console.log('Error:', error.message);
          }
      }

  } catch (err: any) {
      console.error('Script Error:', err.message);
  } finally {
      await prisma.$disconnect();
  }
}

main();
