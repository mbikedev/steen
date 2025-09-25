import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("toewijzingen_staff")
      .select("*")
      .order("position");

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch staff" },
        { status: 500 },
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { position, name, assignment_date } = await request.json();
    
    // Ensure we have assignment_date, default to today if not provided
    const date = assignment_date || new Date().toISOString().split('T')[0];
    
    const payload = {
      staff_index: position,
      staff_name: name,
      assignment_date: date,
    };

    const { data, error } = await supabase
      .from("toewijzingen_staff")
      .upsert(payload, {
        onConflict: 'assignment_date,staff_index',
        ignoreDuplicates: false
      })
      .select()
      .single();

    // Handle unique constraint violations gracefully
    if (error && (
      error.message?.includes("unique_staff_position_per_date") ||
      error.message?.includes("unique_staff_name_per_date") ||
      error.code === '23505'
    )) {
      console.log("Duplicate staff assignment detected, updating existing record");
      
      // Try to update the existing record based on position
      const { data: updateData, error: updateError } = await supabase
        .from("toewijzingen_staff")
        .update(payload)
        .eq("assignment_date", date)
        .eq("staff_index", position)
        .select()
        .single();
        
      if (updateError) {
        console.error("Failed to update existing staff record:", updateError);
        return NextResponse.json(
          { error: "Failed to save staff: position or name already assigned" },
          { status: 409 },
        );
      }
      
      return NextResponse.json(updateData);
    }

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save staff" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error saving staff:", error);
    return NextResponse.json(
      { error: "Failed to save staff" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { position, name, assignment_date } = await request.json();
    
    // Ensure we have assignment_date, default to today if not provided
    const date = assignment_date || new Date().toISOString().split('T')[0];
    
    const payload = {
      staff_index: position,
      staff_name: name,
      assignment_date: date,
    };

    // Use upsert to handle both insert and update cases
    const { data, error } = await supabase
      .from("toewijzingen_staff")
      .upsert(payload, {
        onConflict: 'assignment_date,staff_index',
        ignoreDuplicates: false
      })
      .select()
      .single();

    // Handle unique constraint violations gracefully
    if (error && (
      error.message?.includes("unique_staff_position_per_date") ||
      error.message?.includes("unique_staff_name_per_date") ||
      error.code === '23505'
    )) {
      console.log("Duplicate staff assignment detected, updating existing record");
      
      // Try to update the existing record based on position
      const { data: updateData, error: updateError } = await supabase
        .from("toewijzingen_staff")
        .update(payload)
        .eq("assignment_date", date)
        .eq("staff_index", position)
        .select()
        .single();
        
      if (updateError) {
        console.error("Failed to update existing staff record:", updateError);
        return NextResponse.json(
          { error: "Failed to update staff: position or name already assigned" },
          { status: 409 },
        );
      }
      
      return NextResponse.json(updateData);
    }

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update staff" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json(
      { error: "Failed to update staff" },
      { status: 500 },
    );
  }
}
