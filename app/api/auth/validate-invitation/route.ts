import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin operations
);

export async function POST(request: Request) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token and email are required', valid: false },
        { status: 400 }
      );
    }

    // Check if invitation exists and is valid
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation', valid: false },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired', valid: false },
        { status: 410 }
      );
    }

    // Check if invitation has already been used
    if (invitation.used_at) {
      return NextResponse.json(
        { error: 'Invitation has already been used', valid: false },
        { status: 409 }
      );
    }

    // Validate email domain against whitelist
    const emailDomain = email.split('@')[1];
    const { data: allowedDomain } = await supabase
      .from('allowed_email_domains')
      .select('*')
      .eq('domain', emailDomain)
      .eq('is_active', true)
      .single();

    if (!allowedDomain) {
      return NextResponse.json(
        {
          error: `Email domain @${emailDomain} is not authorized. Please use your official center email.`,
          valid: false
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at
      }
    });

  } catch (error) {
    console.error('Invitation validation error:', error);
    return NextResponse.json(
      { error: 'An error occurred during validation', valid: false },
      { status: 500 }
    );
  }
}
