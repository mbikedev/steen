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
        },
        {
          name: 'get_residents',
          description: 'Get all residents from the database',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Maximum number of residents to return (default: 100)'
              }
            }
          }
        },
        {
          name: 'get_rooms',
          description: 'Get all rooms from the database',
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
            const schemaQuery = `
              SELECT column_name, data_type, is_nullable, column_default
              FROM information_schema.columns
              WHERE table_name = $1
              ORDER BY ordinal_position;
            `;
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
            const tablesQuery = `
              SELECT table_name, table_type
              FROM information_schema.tables
              WHERE table_schema = 'public'
              ORDER BY table_name;
            `;
            const tablesResult = await this.pgClient.query(tablesQuery);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(tablesResult.rows, null, 2)
                }
              ]
            };

          case 'get_residents':
            const limit = args.limit || 100;
            const residentsQuery = `
              SELECT * FROM residents 
              ORDER BY badge 
              LIMIT $1;
            `;
            const residentsResult = await this.pgClient.query(residentsQuery, [limit]);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(residentsResult.rows, null, 2)
                }
              ]
            };

          case 'get_rooms':
            const roomsQuery = `
              SELECT * FROM rooms 
              ORDER BY building, floor, room_number;
            `;
            const roomsResult = await this.pgClient.query(roomsQuery);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(roomsResult.rows, null, 2)
                }
              ]
            };

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
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
