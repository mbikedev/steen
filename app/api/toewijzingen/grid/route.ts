import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use only the anon key for now as service role key is invalid
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials are not configured");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function sanitizeGridPayload(input: any) {
  const rowNumber = Number(input.row_number);
  const columnNumber = Number(input.column_number);

  return {
    row_number: Number.isFinite(rowNumber) ? rowNumber : input.row_number,
    column_number: Number.isFinite(columnNumber)
      ? columnNumber
      : input.column_number,
    resident_name:
      typeof input.resident_name === "string" ? input.resident_name.trim() : "",
    color_status: input.color_status ?? null,
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("toewijzingen_grid")
      .select("*")
      .order("row_number, column_number");

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch grid data" },
        { status: 500 },
      );
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("Error fetching grid data:", error);
    return NextResponse.json(
      { error: "Failed to fetch grid data" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = sanitizeGridPayload(body);
    const supabase = getSupabaseClient();

    console.log("Upserting grid data:", payload);

    // Use upsert with proper unique constraint handling
    // First try to find existing record based on unique constraint fields
    const { data: existingData } = await supabase
      .from("toewijzingen_grid")
      .select("id")
      .eq("assignment_date", payload.assignment_date)
      .eq("row_index", payload.row_index || payload.row_number)
      .eq("col_index", payload.col_index || payload.column_number)
      .single();

    let data, error;

    if (existingData) {
      // Update existing record - try with color first, then without
      let updateResult = await supabase
        .from("toewijzingen_grid")
        .update(payload)
        .eq("id", existingData.id)
        .select()
        .single();

      // If color column doesn't exist, try without it
      if (
        updateResult.error &&
        updateResult.error.message?.includes("color_status")
      ) {
        const payloadWithoutColor = { ...payload };
        delete (payloadWithoutColor as any).color_status;
        updateResult = await supabase
          .from("toewijzingen_grid")
          .update(payloadWithoutColor)
          .eq("id", existingData.id)
          .select()
          .single();
      }

      data = updateResult.data;
      error = updateResult.error;
    } else {
      // Insert new record - try with color first, then without
      let insertResult = await supabase
        .from("toewijzingen_grid")
        .insert(payload)
        .select()
        .single();

      // Handle unique constraint violations gracefully
      if (
        insertResult.error &&
        (insertResult.error.message?.includes("unique_grid_position_per_date") ||
         insertResult.error.code === '23505') // PostgreSQL unique violation code
      ) {
        console.log("Duplicate grid position detected, updating existing record instead");
        // Find the existing record and update it
        const { data: duplicateRecord } = await supabase
          .from("toewijzingen_grid")
          .select("id")
          .eq("assignment_date", payload.assignment_date)
          .eq("row_index", payload.row_index || payload.row_number)
          .eq("col_index", payload.col_index || payload.column_number)
          .single();

        if (duplicateRecord) {
          insertResult = await supabase
            .from("toewijzingen_grid")
            .update(payload)
            .eq("id", duplicateRecord.id)
            .select()
            .single();
        }
      }

      // If color column doesn't exist, try without it
      if (
        insertResult.error &&
        insertResult.error.message?.includes("color_status")
      ) {
        const payloadWithoutColor = { ...payload };
        delete (payloadWithoutColor as any).color_status;
        insertResult = await supabase
          .from("toewijzingen_grid")
          .insert(payloadWithoutColor)
          .select()
          .single();
      }

      data = insertResult.data;
      error = insertResult.error;
    }

    if (error) {
      console.error("Supabase upsert error:", error);
      console.error("Payload was:", payload);
      return NextResponse.json(
        { error: "Failed to save grid data", details: error.message },
        { status: 500 },
      );
    }

    console.log("Successfully upserted:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error saving grid data:", error);
    return NextResponse.json(
      { error: "Failed to save grid data", details: String(error) },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const payload = sanitizeGridPayload(body);
    const supabase = getSupabaseClient();

    console.log("Processing grid data:", payload);

    // Only delete if both resident_name is empty AND there's no color
    if (
      (!payload.resident_name || payload.resident_name.trim() === "") &&
      !payload.color_status
    ) {
      const { error: deleteError } = await supabase
        .from("toewijzingen_grid")
        .delete()
        .eq("row_number", payload.row_number)
        .eq("column_number", payload.column_number);

      if (deleteError) {
        console.error("Error deleting record:", deleteError);
        // Don't return error if record doesn't exist (already deleted)
        if (!deleteError.message.includes("No rows found")) {
          return NextResponse.json(
            {
              error: "Failed to delete grid data",
              details: deleteError.message,
            },
            { status: 500 },
          );
        }
      }

      console.log(
        "Successfully deleted empty record for row:",
        payload.row_number,
        "col:",
        payload.column_number,
      );
      return NextResponse.json({
        message: "Record deleted",
        row_number: payload.row_number,
        column_number: payload.column_number,
      });
    }

    // First try to find existing record
    const { data: existingData } = await supabase
      .from("toewijzingen_grid")
      .select("id")
      .eq("row_number", payload.row_number)
      .eq("column_number", payload.column_number)
      .single();

    let data, error;

    if (existingData) {
      // Update existing record - try with color first, then without
      let updateResult = await supabase
        .from("toewijzingen_grid")
        .update(payload)
        .eq("id", existingData.id)
        .select()
        .single();

      // If color column doesn't exist, try without it
      if (
        updateResult.error &&
        updateResult.error.message?.includes("color_status")
      ) {
        const payloadWithoutColor = { ...payload };
        delete (payloadWithoutColor as any).color_status;
        updateResult = await supabase
          .from("toewijzingen_grid")
          .update(payloadWithoutColor)
          .eq("id", existingData.id)
          .select()
          .single();
      }

      data = updateResult.data;
      error = updateResult.error;
    } else {
      // Insert new record - try with color first, then without
      let insertResult = await supabase
        .from("toewijzingen_grid")
        .insert(payload)
        .select()
        .single();

      // If color column doesn't exist, try without it
      if (
        insertResult.error &&
        insertResult.error.message?.includes("color_status")
      ) {
        const payloadWithoutColor = { ...payload };
        delete (payloadWithoutColor as any).color_status;
        insertResult = await supabase
          .from("toewijzingen_grid")
          .insert(payloadWithoutColor)
          .select()
          .single();
      }

      data = insertResult.data;
      error = insertResult.error;
    }

    if (error) {
      console.error("Supabase upsert error:", error);
      console.error("Payload was:", payload);
      return NextResponse.json(
        { error: "Failed to update grid data", details: error.message },
        { status: 500 },
      );
    }

    console.log("Successfully upserted:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating grid data:", error);
    return NextResponse.json(
      { error: "Failed to update grid data", details: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const rowNumber = url.searchParams.get("row_number");
    const columnNumber = url.searchParams.get("column_number");
    const residentName = url.searchParams.get("resident_name");

    // Support both row/column deletion and resident name deletion
    if (residentName) {
      // Delete by resident name - find and delete all cells containing this resident
      const supabase = getSupabaseClient();

      // Use exact matching with trimmed names for better precision
      const { error } = await supabase
        .from("toewijzingen_grid")
        .delete()
        .eq("resident_name", residentName.trim());

      if (error) {
        console.error("Error deleting grid data by resident name:", error);
        return NextResponse.json(
          {
            error: "Failed to delete grid data by resident name",
            details: error.message,
          },
          { status: 500 },
        );
      }

      console.log("Successfully deleted grid data for resident:", residentName);
      return NextResponse.json({
        message: "Records deleted successfully for resident",
        resident_name: residentName,
      });
    }

    if (!rowNumber || !columnNumber) {
      return NextResponse.json(
        {
          error:
            "Either (row_number and column_number) or resident_name is required",
        },
        { status: 400 },
      );
    }

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("toewijzingen_grid")
      .delete()
      .eq("row_number", parseInt(rowNumber))
      .eq("column_number", parseInt(columnNumber));

    if (error) {
      console.error("Error deleting grid data:", error);
      return NextResponse.json(
        { error: "Failed to delete grid data", details: error.message },
        { status: 500 },
      );
    }

    console.log(
      "Successfully deleted grid data for row:",
      rowNumber,
      "col:",
      columnNumber,
    );
    return NextResponse.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("Error deleting grid data:", error);
    return NextResponse.json(
      { error: "Failed to delete grid data", details: String(error) },
      { status: 500 },
    );
  }
}
