#!/usr/bin/env tsx
// Simple startup wrapper for the MCP server
// This ensures the server starts correctly when invoked as a subprocess

import server from './mcp-server.js';

// Start the server
server.start({
  transportType: "stdio",
}); 