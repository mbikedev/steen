import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST() {
  try {
    const supabase = createClient() as any;

    console.log(
      "🔧 Starting database schema update for administrative_documents table...",
    );

    // First, check if columns already exist by trying a simple select
    let columnsExist = { badge: false, name: false };

    // Check for resident_badge column
    try {
      const { error: badgeError } = await supabase
        .from("administrative_documents")
        .select("resident_badge")
        .limit(1);

      if (!badgeError) {
        columnsExist.badge = true;
      }
    } catch (e) {
      // Column doesn't exist
    }

    // Check for resident_name column
    try {
      const { error: nameError } = await supabase
        .from("administrative_documents")
        .select("resident_name")
        .limit(1);

      if (!nameError) {
        columnsExist.name = true;
      }
    } catch (e) {
      // Column doesn't exist
    }

    // If both columns exist, we're already set up
    if (columnsExist.badge && columnsExist.name) {
      console.log("✅ Columns already exist, populating any missing data...");

      // Update any records that might have missing badge/name data
      const { data: residents } = await supabase
        .from("residents")
        .select("id, badge, first_name, last_name");

      if (residents && residents.length > 0) {
        let updatedCount = 0;
        for (const resident of residents) {
          const { error: updateError } = await supabase
            .from("administrative_documents")
            .update({
              resident_badge: resident.badge?.toString(),
              resident_name: `${resident.first_name} ${resident.last_name}`,
            })
            .eq("resident_id", resident.id)
            .or("resident_badge.is.null,resident_name.is.null");

          if (!updateError) {
            updatedCount++;
          }
        }
        console.log(`✅ Updated ${updatedCount} records with badge/name data`);
      }

      return NextResponse.json({
        success: true,
        message:
          "Database columns already exist and data has been synchronized.",
        columnsExisted: true,
      });
    }

    // If columns don't exist, we need manual setup
    console.log(
      "⚠️ Columns do not exist, providing manual setup instructions...",
    );

    return NextResponse.json({
      success: false,
      needsManualSetup: true,
      message:
        "Database columns need to be added manually. Please run the provided SQL in your Supabase SQL Editor.",
      sql: `
-- Run this SQL in your Supabase SQL Editor:

-- Add the missing columns
ALTER TABLE administrative_documents
ADD COLUMN IF NOT EXISTS resident_badge TEXT;

ALTER TABLE administrative_documents
ADD COLUMN IF NOT EXISTS resident_name TEXT;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_administrative_documents_resident_badge
ON administrative_documents(resident_badge);

CREATE INDEX IF NOT EXISTS idx_administrative_documents_resident_name
ON administrative_documents(resident_name);

-- Populate existing records with badge/name data from residents table
UPDATE administrative_documents ad
SET
  resident_badge = r.badge::text,
  resident_name = CONCAT(r.first_name, ' ', r.last_name)
FROM residents r
WHERE ad.resident_id = r.id
  AND (ad.resident_badge IS NULL OR ad.resident_name IS NULL);

-- Verify the update
SELECT COUNT(*) as total_docs,
       COUNT(resident_badge) as docs_with_badge,
       COUNT(resident_name) as docs_with_name
FROM administrative_documents;
      `,
    });
  } catch (error) {
    console.error("❌ Critical error in database setup:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during database setup",
        needsManualSetup: true,
        sql: `
-- Run this SQL in your Supabase SQL Editor:

-- Add the missing columns
ALTER TABLE administrative_documents
ADD COLUMN IF NOT EXISTS resident_badge TEXT;

ALTER TABLE administrative_documents
ADD COLUMN IF NOT EXISTS resident_name TEXT;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_administrative_documents_resident_badge
ON administrative_documents(resident_badge);

CREATE INDEX IF NOT EXISTS idx_administrative_documents_resident_name
ON administrative_documents(resident_name);

-- Populate existing records with badge/name data from residents table
UPDATE administrative_documents ad
SET
  resident_badge = r.badge::text,
  resident_name = CONCAT(r.first_name, ' ', r.last_name)
FROM residents r
WHERE ad.resident_id = r.id
  AND (ad.resident_badge IS NULL OR ad.resident_name IS NULL);

-- Verify the update
SELECT COUNT(*) as total_docs,
       COUNT(resident_badge) as docs_with_badge,
       COUNT(resident_name) as docs_with_name
FROM administrative_documents;
      `,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const supabase = createClient() as any;

    // Check if columns exist
    const { data, error } = await supabase
      .from("administrative_documents")
      .select("resident_badge, resident_name")
      .limit(1);

    if (error) {
      if (error.code === "42703") {
        // column does not exist
        return NextResponse.json({
          success: false,
          columnsExist: false,
          message:
            "Required columns (resident_badge, resident_name) do not exist",
          needsSetup: true,
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: "Error checking database schema",
          details: error,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      columnsExist: true,
      message: "Database schema is ready for enhanced document synchronization",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error checking database",
      },
      { status: 500 },
    );
  }
}
