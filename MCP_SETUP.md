# Supabase MCP Server Setup

This project now includes a Model Context Protocol (MCP) server for interacting with your Supabase PostgreSQL database.

## Files Created

- `mcp-server.js` - The MCP server implementation
- `claude-mcp-config.json` - Configuration for Claude Desktop
- `mcp-config.json` - Alternative configuration format

## Setup Instructions

### 1. Configure Database Connection

You need to set your Supabase database connection string. You can do this in two ways:

#### Option A: Environment Variable
Create a `.env` file in the project root:
```bash
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.xxcbpsjefpogxgfellui.supabase.co:5432/postgres
```

#### Option B: Update Configuration File
Edit `claude-mcp-config.json` and replace `[YOUR_PASSWORD]` with your actual Supabase database password.

### 2. Test the MCP Server

Run the MCP server directly to test it:
```bash
node mcp-server.js
```

### 3. Configure Claude Desktop

1. Open Claude Desktop
2. Go to Settings → MCP Servers
3. Add a new server with the configuration from `claude-mcp-config.json`
4. Replace `[YOUR_PASSWORD]` with your actual database password

## Available Tools

The MCP server provides these tools:

- `query_database` - Execute custom SQL queries
- `get_table_schema` - Get schema information for a table
- `list_tables` - List all tables in the database
- `get_residents` - Get residents data
- `get_rooms` - Get rooms data

## Usage Examples

Once configured, you can ask Claude to:
- "Show me all residents in the database"
- "What's the schema of the residents table?"
- "Query the database for residents with badge number 24191"
- "List all tables in the database"

## Troubleshooting

1. **Connection Issues**: Make sure your DATABASE_URL is correct and your Supabase database is accessible
2. **Permission Issues**: Ensure your database user has the necessary permissions
3. **SSL Issues**: The server is configured to use SSL with `rejectUnauthorized: false` for Supabase compatibility

## Security Note

The MCP server allows direct SQL queries. Make sure to:
- Use read-only database users when possible
- Be careful with the queries you execute
- Consider implementing additional security measures for production use
