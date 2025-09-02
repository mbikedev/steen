#!/bin/bash

# Start PHP Backend Server for Local Development
# This script starts a PHP development server for testing the API locally

echo "🚀 Starting PHP Backend Server..."
echo "================================"

# Check if PHP is installed
if ! command -v php &> /dev/null; then
    echo "❌ PHP is not installed. Please install PHP first."
    echo "   On macOS: brew install php"
    echo "   On Ubuntu: sudo apt-get install php"
    exit 1
fi

# Check PHP version
PHP_VERSION=$(php -v | head -n 1)
echo "✅ Found $PHP_VERSION"

# Navigate to API directory
cd api/php

# Update config.php for local development if needed
echo ""
echo "📝 Configuration Notes:"
echo "   - Make sure to update api/php/config.php with your local MySQL credentials"
echo "   - Or use the default development settings"
echo ""

# Start PHP development server
echo "🌐 Starting server on http://localhost:8000"
echo "   API will be available at: http://localhost:8000/api/php/"
echo ""
echo "📋 Available endpoints:"
echo "   - GET  http://localhost:8000/test-connection.php"
echo "   - GET  http://localhost:8000/residents.php"
echo "   - POST http://localhost:8000/residents.php"
echo "   - PUT  http://localhost:8000/residents.php?id=1"
echo "   - DELETE http://localhost:8000/residents.php?id=1"
echo ""
echo "Press Ctrl+C to stop the server"
echo "================================"

# Start the server from the project root, serving the api directory
cd ../..
php -S localhost:8000 -t .