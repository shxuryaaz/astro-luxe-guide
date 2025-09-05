#!/usr/bin/env node

/**
 * Keep Alive Script for Render Deployment
 * Pings the Render app every 5 minutes to prevent it from going to sleep
 */

import https from 'https';
import http from 'http';

// Configuration
const RENDER_URL = process.env.RENDER_URL || 'https://astro-luxe-guide.onrender.com';
const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const HEALTH_ENDPOINT = '/health';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function pingServer() {
  const url = new URL(RENDER_URL + HEALTH_ENDPOINT);
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;
  
  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname + url.search,
    method: 'GET',
    timeout: 30000, // 30 second timeout
    headers: {
      'User-Agent': 'Keep-Alive-Script/1.0',
      'Accept': 'application/json, text/plain, */*'
    }
  };

  log(`🔄 Pinging ${RENDER_URL}${HEALTH_ENDPOINT}...`, 'cyan');

  const req = client.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        log(`✅ Ping successful! Status: ${res.statusCode}`, 'green');
        if (data) {
          try {
            const response = JSON.parse(data);
            log(`📊 Response: ${JSON.stringify(response)}`, 'blue');
          } catch (e) {
            log(`📄 Response: ${data.substring(0, 100)}${data.length > 100 ? '...' : ''}`, 'blue');
          }
        }
      } else {
        log(`⚠️ Ping returned status: ${res.statusCode}`, 'yellow');
        log(`📄 Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`, 'yellow');
      }
    });
  });

  req.on('error', (error) => {
    log(`❌ Ping failed: ${error.message}`, 'red');
  });

  req.on('timeout', () => {
    log(`⏰ Ping timeout after 30 seconds`, 'red');
    req.destroy();
  });

  req.end();
}

function startKeepAlive() {
  log(`🚀 Starting Keep-Alive service for ${RENDER_URL}`, 'bright');
  log(`⏰ Ping interval: ${PING_INTERVAL / 1000} seconds`, 'bright');
  log(`🎯 Health endpoint: ${HEALTH_ENDPOINT}`, 'bright');
  log(`📝 Press Ctrl+C to stop`, 'bright');
  log('', 'reset');

  // Initial ping
  pingServer();

  // Set up interval
  const interval = setInterval(pingServer, PING_INTERVAL);

  // Graceful shutdown
  process.on('SIGINT', () => {
    log('\n🛑 Shutting down Keep-Alive service...', 'yellow');
    clearInterval(interval);
    log('✅ Keep-Alive service stopped', 'green');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log('\n🛑 Received SIGTERM, shutting down...', 'yellow');
    clearInterval(interval);
    log('✅ Keep-Alive service stopped', 'green');
    process.exit(0);
  });
}

// Check if RENDER_URL is set
if (!process.env.RENDER_URL) {
  log('⚠️ RENDER_URL environment variable not set', 'yellow');
  log('💡 Using default URL: https://astro-luxe-guide.onrender.com', 'yellow');
  log('💡 To set custom URL: export RENDER_URL=https://your-app.onrender.com', 'yellow');
  log('', 'reset');
}

// Start the service
startKeepAlive();
