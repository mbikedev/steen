#!/bin/bash

# Test API endpoints using curl
# Update the API_URL with your actual domain

API_URL="https://mikaty.eastatwest.com/api/php/index.php"
API_KEY="1ba761ebdd3abc01bab1e885a6577b442c3060f3ec57eae32e8d4fd82c4ea630"

# For local testing, uncomment this line:
# API_URL="http://localhost:8000/api/php/index.php"

echo "========================================="
echo "Testing Steen API Endpoints"
echo "========================================="
echo ""

# Test 1: Test connection
echo "1. Testing database connection..."
curl -X GET "${API_URL}?endpoint=test-connection" \
  -H "X-Api-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -s | json_pp

echo ""
echo "========================================="
echo ""

# Test 2: Get all residents
echo "2. Getting all residents..."
curl -X GET "${API_URL}?endpoint=residents" \
  -H "X-Api-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -s | json_pp

echo ""
echo "========================================="
echo ""

# Test 3: Add a new resident
echo "3. Adding a test resident..."
curl -X POST "${API_URL}?endpoint=residents" \
  -H "X-Api-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "badge": 88888,
    "firstName": "Test",
    "lastName": "Resident",
    "room": "101",
    "nationality": "Belgium",
    "ovNumber": "OV12345",
    "registerNumber": "REG12345",
    "dateOfBirth": "1990-01-15",
    "age": 34,
    "gender": "M",
    "referencePerson": "Test Reference",
    "dateIn": "2025-01-01",
    "daysOfStay": 30,
    "status": "active",
    "remarks": "Test via curl script",
    "roomRemarks": "Testing room assignment"
  }' \
  -s | json_pp

echo ""
echo "========================================="
echo ""

# Test 4: Verify the resident was added
echo "4. Verifying resident was added (getting all residents again)..."
curl -X GET "${API_URL}?endpoint=residents" \
  -H "X-Api-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -s | json_pp | grep -A 5 -B 5 "88888"

echo ""
echo "========================================="
echo "Test complete!"
echo "========================================="