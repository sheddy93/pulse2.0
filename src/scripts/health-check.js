/**
 * Health Check Script - Verifica stato post-deployment
 */
import https from 'https';
import process from 'process';

const endpoints = [
  { url: 'https://api.pulsehr.app/health', name: 'API Health' },
  { url: 'https://api.pulsehr.app/status', name: 'Status Page' },
  { url: 'https://pulsehr.app', name: 'Main App' }
];

async function checkEndpoint(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      const isHealthy = res.statusCode === 200;
      console.log(`${isHealthy ? '✅' : '❌'} ${url} (${res.statusCode})`);
      resolve(isHealthy);
    }).on('error', (e) => {
      console.log(`❌ ${url} (${e.message})`);
      resolve(false);
    });
  });
}

async function runHealthChecks() {
  console.log('🔍 Running health checks...\n');
  
  let allHealthy = true;
  for (const endpoint of endpoints) {
    const healthy = await checkEndpoint(endpoint.url);
    if (!healthy) allHealthy = false;
  }

  console.log(`\n${allHealthy ? '✅ All systems operational' : '❌ Some issues detected'}`);
  process.exit(allHealthy ? 0 : 1);
}

runHealthChecks();