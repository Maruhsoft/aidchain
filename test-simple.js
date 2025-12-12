import fetch from 'node-fetch';

async function test() {
  try {
    console.log('Testing /test endpoint...');
    const res1 = await fetch('http://localhost:3001/test');
    console.log(`/test response: ${res1.status}`);
    const data1 = await res1.json();
    console.log('Response:', data1);

    console.log('\nTesting /api/health endpoint...');
    const res2 = await fetch('http://localhost:3001/api/health');
    console.log(`/api/health response: ${res2.status}`);
    const data2 = await res2.json();
    console.log('Response:', data2);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
