/**
 * Health Check Script for WhaTicket Backend
 * Used by Docker and EasyPanel to verify service health
 */

const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.PORT || 8080,
  path: '/api/health',
  timeout: 2000
};

const healthCheck = http.request(options, (res) => {
  console.log(`HEALTHCHECK STATUS: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

healthCheck.on('error', (err) => {
  console.error('HEALTHCHECK ERROR:', err.message);
  process.exit(1);
});

healthCheck.end();
