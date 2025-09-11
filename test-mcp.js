#!/usr/bin/env node

// Simple test script for the MCP server
const { spawn } = require('child_process');

console.log('🧪 Testing Supabase MCP Server...\n');

// Test the server by sending a list tools request
const server = spawn('node', ['mcp-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Send a list tools request
const listToolsRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
};

server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

let output = '';
server.stdout.on('data', (data) => {
  output += data.toString();
  console.log('📤 Server Response:');
  console.log(JSON.stringify(JSON.parse(output), null, 2));
});

server.stderr.on('data', (data) => {
  console.log('📝 Server Log:', data.toString());
});

server.on('close', (code) => {
  console.log(`\n✅ MCP Server test completed with code ${code}`);
  process.exit(0);
});

// Kill the server after 5 seconds
setTimeout(() => {
  server.kill();
  console.log('\n⏰ Test timeout - server stopped');
}, 5000);
