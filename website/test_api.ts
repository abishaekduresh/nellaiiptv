import 'dotenv/config';
import axios from 'axios';

async function testApi() {
  try {
    const res = await axios.get('http://localhost/nellaiiptv/backend/public/api/admin/scrolling-ads', {
      headers: {
        'X-Client-Platform': 'web',
        'X-API-KEY': 'xkey_for_local_dev_only_12345'
        // Skipping bearer token if it's protected to see what happens
      }
    });
    console.log("Success! Data:", res.data);
  } catch (err: any) {
    console.error("Error Status:", err.response?.status);
    console.error("Error Data:", err.response?.data);
  }
}

testApi();
