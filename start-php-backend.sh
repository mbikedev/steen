#!/bin/bash
# start-php-backend.sh - Starts the PHP backend server with a router

# --- Configuration ---
PORT=8080
HOST=localhost
DOC_ROOT="./api/php"
ROUTER="router.php"

# --- Color Codes ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Main Logic ---
echo -e "${GREEN}🚀 Starting PHP Backend Server...${NC}"
echo "================================"

# 1. Check for PHP installation
if ! command -v php &> /dev/null
then
    echo -e "${RED}❌ PHP is not installed. Please install PHP first.${NC}"
    echo -e "   On macOS: ${YELLOW}brew install php${NC}"
    echo -e "   On Ubuntu: ${YELLOW}sudo apt-get install php${NC}"
    exit 1
fi

# 2. Check if the document root exists
if [ ! -d "$DOC_ROOT" ]; then
    echo -e "${RED}❌ Document root not found at '$DOC_ROOT'${NC}"
    exit 1
fi

# 3. Check if the router script exists
if [ ! -f "$DOC_ROOT/$ROUTER" ]; then
    echo -e "${RED}❌ Router script not found at '$DOC_ROOT/$ROUTER'${NC}"
    exit 1
fi

# 4. Start the PHP server
echo -e "✅ PHP found: $(php -v | head -n 1)"
echo -e "✅ Document Root: ${YELLOW}$DOC_ROOT${NC}"
echo -e "✅ Router Script: ${YELLOW}$ROUTER${NC}"
echo -e "--------------------------------"
echo -e "${GREEN}🌍 Server listening on http://$HOST:$PORT${NC}"
echo "   Press Ctrl+C to stop."

php -S "$HOST:$PORT" -t "$DOC_ROOT" "$DOC_ROOT/$ROUTER"
