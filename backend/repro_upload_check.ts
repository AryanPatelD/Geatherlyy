
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function main() {
  // 1. Login as faculty to get token
  console.log('Logging in as faculty...');
  let token;
  try {
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
          email: 'faculty@gatherly.com',
          password: 'password123'
      });
      token = loginRes.data.access_token;
      console.log('Login successful. Token obtained.');
  } catch (e: any) {
      console.error('Login failed:', e.response?.data || e.message);
      return;
  }

  // 2. Create a dummy club just to have an ID (if not exists)
  // Or assuming club ID exists. Let's create one quickly.
  // Actually, we need to create it AS the faculty to be safe or check if one exists.
  // Since we wiped data, we need to create one.
  console.log('Creating mock club...');
  let clubId;
  try {
      const clubRes = await axios.post(`${API_URL}/clubs`, {
          name: 'Resource Test Club',
          description: 'Testing uploads',
          category: 'Technical',
          mentorEmails: JSON.stringify(['faculty@gatherly.com', 'other.mentor@gatherly.com']),
          convenorEmail: 'faculty@gatherly.com'
      }, { headers: { Authorization: `Bearer ${token}` } });
      console.log('Club created. ID:', clubId);
  } catch(e: any) {
      console.log('Club creation failed/exists. Trying to fetch existing club...');
       // Try to find one
       const club = await prisma.club.findFirst();
       if(club) {
           clubId = club.id;
           console.log('Found existing club ID:', clubId);
       } else {
           console.error('No clubs found in DB. Cannot proceed.');
           return;
       }
  }

  if (!clubId) {
      console.error('No club found/created. Cannot test upload.');
      return;
  }

  // 3. Attempt upload WITHOUT file (mocking metadata only first, or mocking file if possible)
  // Axios requires FormData for file uploads.
  // We'll skip file to see if it even passes Guard.
  // The controller uses @UseInterceptors(FileInterceptor('file')) so it expects 'file'.
  // But let's see if we get 403 or 400 (Bad Request). 403 means Guard blocked it.
  
  console.log('Attempting upload request...');
  try {
      // Sending JSON body without file to check permission first
      // Actually, standard upload sends multipart.
      // If we send just headers, RolesGuard runs BEFORE interceptor? Yes.
      // So if we get 403, it's roles.
      
      const res = await axios.post(`${API_URL}/resources`, {
          title: 'Test Resource',
          description: 'Testing',
          clubId: String(clubId),
          type: 'PDF'
      }, {
          headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Upload success (unexpected without file?):', res.status);
  } catch (error: any) {
      if (error.response) {
          console.log(`Response Status: ${error.response.status}`);
          console.log('Response Body:', error.response.data);
          
          if (error.response.status === 403) {
              console.log('VIOLATION: 403 Forbidden. Current user role is likely rejected.');
          } else {
              console.log('Not a permission error (e.g. 500 or 400). Guard passed.');
          }
      } else {
          console.error('Error:', error.message);
      }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
