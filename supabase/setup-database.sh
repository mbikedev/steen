#!/bin/bash

# Supabase Database Setup Script
# This script sets up the database schema and seeds it with data from the PDFs

echo "🚀 Setting up Asylum Center Database..."
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local file not found!"
    echo "Please create a .env.local file with your Supabase credentials:"
    echo ""
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
    echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    echo "DATABASE_URL=your_database_url"
    echo ""
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not found in .env.local"
    echo "Please add your Supabase database URL to .env.local"
    exit 1
fi

echo "📊 Creating database schema..."
psql "$DATABASE_URL" -f supabase/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema created successfully!"
else
    echo "❌ Error creating schema"
    exit 1
fi

echo ""
echo "🌱 Seeding database with PDF data..."
psql "$DATABASE_URL" -f supabase/seed-data.sql

if [ $? -eq 0 ]; then
    echo "✅ Data seeded successfully!"
else
    echo "❌ Error seeding data"
    exit 1
fi

echo ""
echo "📈 Database Summary:"
psql "$DATABASE_URL" -c "SELECT * FROM data_summary;"

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "You can now:"
echo "1. Start the development server: npm run dev"
echo "2. Visit http://localhost:3000/dashboard"
echo "3. View residents at http://localhost:3000/dashboard/residents"
echo "4. View accommodations at http://localhost:3000/dashboard/accommodations"