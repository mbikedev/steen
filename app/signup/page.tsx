import { createClient } from '../../lib/supabase/server';
import { redirect } from 'next/navigation';
import SignupForm from '../../components/auth/SignupForm';

export default async function SignupPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  }

  return <SignupForm />;
}
