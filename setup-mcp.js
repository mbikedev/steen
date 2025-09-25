#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// MCP Server configuration for Supabase
const mcpConfig = {
  name: "supabase-mcp-server",
  version: "1.0.0",
  description: "MCP Server for Supabase PostgreSQL database",
  main: "mcp-server.js",
  scripts: {
    "start": "node mcp-server.js",
    "dev": "node --watch mcp-server.js"
  },
  dependencies: {
    "@modelcontextprotocol/sdk": "^1.17.5",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1"
  }
};

// Create the MCP server file
const mcpServerCode = `
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { Client } = require('pg');
require('dotenv').config();

class SupabaseMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'supabase-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.pgClient = new Client({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_CONNECTION_STRING,
      ssl: { rejectUnauthorized: false }
    });

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'query_database',
          description: 'Execute SQL queries on the Supabase PostgreSQL database',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'SQL query to execute'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'get_table_schema',
          description: 'Get the schema of a specific table',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: {
                type: 'string',
                description: 'Name of the table to get schema for'
              }
            },
            required: ['tableName']
          }
        },
        {
          name: 'list_tables',
          description: 'List all tables in the database',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        await this.pgClient.connect();

        switch (name) {
          case 'query_database':
            const result = await this.pgClient.query(args.query);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result.rows, null, 2)
                }
              ]
            };

          case 'get_table_schema':
            const schemaQuery = \`
              SELECT column_name, data_type, is_nullable, column_default
              FROM information_schema.columns
              WHERE table_name = $1
              ORDER BY ordinal_position;
            \`;
            const schemaResult = await this.pgClient.query(schemaQuery, [args.tableName]);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(schemaResult.rows, null, 2)
                }
              ]
            };

          case 'list_tables':
            const tablesQuery = \`
              SELECT table_name, table_type
              FROM information_schema.tables
              WHERE table_schema = 'public'
              ORDER BY table_name;
            \`;
            const tablesResult = await this.pgClient.query(tablesQuery);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(tablesResult.rows, null, 2)
                }
              ]
            };

          default:
            throw new Error(\`Unknown tool: \${name}\`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: \`Error: \${error.message}\`
            }
          ],
          isError: true
        };
      } finally {
        await this.pgClient.end();
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Supabase MCP Server running on stdio');
  }
}

const server = new SupabaseMCPServer();
server.run().catch(console.error);
`;

// Write the MCP server file
require('fs').writeFileSync('mcp-server.js', mcpServerCode);

// Write package.json for the MCP server
require('fs').writeFileSync('mcp-package.json', JSON.stringify(mcpConfig, null, 2));

console.log('✅ MCP Server files created!');
console.log('📁 Files created:');
console.log('  - mcp-server.js (MCP server implementation)');
console.log('  - mcp-package.json (package configuration)');
console.log('  - mcp-config.json (MCP client configuration)');
console.log('');
console.log('🔧 Next steps:');
console.log('1. Install MCP server dependencies: npm install --prefix . pg dotenv');
console.log('2. Set your DATABASE_URL environment variable');
console.log('3. Run the MCP server: node mcp-server.js');
console.log('');
console.log('💡 To use with Claude Desktop, add this to your MCP configuration:');
console.log(JSON.stringify({
  "mcpServers": {
    "supabase": {
      "command": "node",
      "args": [path.resolve(process.cwd(), "mcp-server.js")],
      "env": {
        "DATABASE_URL": "postgresql://postgres:[PASSWORD]@db.xxcbpsjefpogxgfellui.supabase.co:5432/postgres"
      }
    }
  }
}, null, 2));
`;

// Run the setup
require('fs').writeFileSync('setup-mcp.js', mcpServerCode);
