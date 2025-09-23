'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, Shield, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { ThemeToggle } from '../components/ui/theme-toggle';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    setMounted(true);
    // Check if already logged in
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [router, isAuthenticated]);

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear errors when user starts typing
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is verplicht');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Voer een geldig email adres in');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Wachtwoord is verplicht');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens zijn');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const success = await login(formData.email, formData.password, formData.rememberMe);
      
      if (success) {
        setSuccess('Succesvol ingelogd!');
        // Redirect after short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError('Ongeldige inloggegevens');
      }
    } catch (error) {
      console.error('Login error:', error instanceof Error ? error.message : 'Unknown error');
      setError('Er is een fout opgetreden. Probeer opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setFormData({
      email: 'admin@ooc.be',
      password: 'admin123',
      rememberMe: false
    });
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
      
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="relative w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-foreground rounded-3xl flex items-center justify-center shadow-2xl mb-6">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            OOC Steenokkerzeel
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Beheersysteem Dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-foreground" />
              Inloggen
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Voer uw gegevens in om toegang te krijgen
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-muted border border-border rounded-xl flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-foreground" />
              <p className="text-sm text-foreground font-medium">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-foreground" />
              <p className="text-sm text-foreground font-medium">{error}</p>
            </div>
          )}

          {/* Demo Credentials Info */}
          <div className="mb-6 p-4 bg-muted border border-border rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Demo Account</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Email: admin@ooc.be<br />
                  Wachtwoord: admin123
                </p>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="px-3 py-1.5 text-xs bg-foreground hover:bg-foreground/90 text-background rounded-lg transition-colors font-medium"
              >
                Gebruik Demo
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Adres
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-input rounded-xl bg-background backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder-muted-foreground transition-all"
                  placeholder="uw.email@ooc.be"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Wachtwoord
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-12 py-3 border border-input rounded-xl bg-background backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder-muted-foreground transition-all"
                  placeholder="Uw wachtwoord"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary focus:ring-ring border-input rounded bg-white dark:bg-gray-700"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-foreground">
                  Ingelogd blijven
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
              >
                Wachtwoord vergeten?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Inloggen...
                </>
              ) : (
                'Inloggen'
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              Geen account?{' '}
              <Link
                href="/signup"
                className="font-medium text-foreground hover:text-foreground/80 transition-colors"
              >
                Registreren
              </Link>
            </p>
          </div>
        </div>

        {/* Support Info */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            Problemen met inloggen? Neem contact op met de IT-afdeling
          </p>
        </div>
      </div>
    </div>
  );
}