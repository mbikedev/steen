import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // Create Supabase client at runtime with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { token, email, userId } = await request.json();

    if (!token || !email || !userId) {
      return NextResponse.json(
        { error: 'Token, email, and userId are required' },
        { status: 400 }
      );
    }

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('email', email.toLowerCase())
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation' },
        { status: 404 }
      );
    }

    // Mark invitation as used
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        used_at: new Date().toISOString(),
        used_by: userId,
        is_active: false
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete invitation' },
        { status: 500 }
      );
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        role: invitation.role,
        is_approved: true, // Auto-approve invited users
        invitation_id: invitation.id,
        approved_by: invitation.created_by,
        approved_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      role: invitation.role
    });

  } catch (error) {
    console.error('Complete invitation error:', error);
    return NextResponse.json(
      { error: 'An error occurred completing invitation' },
      { status: 500 }
    );
  }
}
