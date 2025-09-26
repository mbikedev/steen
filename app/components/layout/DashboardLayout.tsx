'use client';

import { ReactNode, useState, useRef, KeyboardEvent, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  Calendar,
  Menu,
  X,
  Bell,
  Search,
  UserCircle,
  List,
  ChefHat,
  MapPin,
  Bed,
  Sun,
  Moon,
  Sparkles,
  UserCheck,
  Grid3X3,
  FileText,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useData } from "../../../lib/DataContext";
import { useAuth } from "../../../lib/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
  onResidentSearch?: (resident: any) => void;
  notificationCount?: number;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Bedden Beheer', href: '/dashboard/bed-management', icon: Bed },
];

const dataMatchItItems = [
  { name: 'Bewonerslijst', href: '/dashboard/bewonerslijst', icon: List },
  { name: 'Keukenlijst', href: '/dashboard/keukenlijst', icon: ChefHat },
];

const kamersItems = [
  { name: 'Noord', href: '/dashboard/noord', icon: MapPin },
  { name: 'Zuid', href: '/dashboard/zuid', icon: MapPin },
];

export default function DashboardLayout({ children, className, onResidentSearch, notificationCount = 0 }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [dataMatchItOpen, setDataMatchItOpen] = useState(false);
  const [kamersOpen, setKamersOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { bewonerslijst, dataMatchIt } = useData();
  const { user, logout } = useAuth();
  
  // Memoize combined residents data and deduplicate by badge to prevent duplicate keys
  const allResidents = useMemo(() => {
    const combined = [...bewonerslijst, ...dataMatchIt];
    // Remove duplicates based on badge number, keeping the first occurrence
    const uniqueResidents = combined.reduce((acc, current) => {
      const existingIndex = acc.findIndex(resident => resident.badge === current.badge);
      if (existingIndex === -1) {
        acc.push(current);
      }
      return acc;
    }, [] as typeof combined);
    return uniqueResidents;
  }, [bewonerslijst, dataMatchIt]);
  
  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Live search effect
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = allResidents.filter(resident => {
        const searchLower = searchQuery.toLowerCase();
        return (
          resident.last_name.toLowerCase().includes(searchLower) ||
          resident.first_name.toLowerCase().includes(searchLower) ||
          resident.badge.toString().includes(searchLower) ||
          (resident.room && resident.room.toLowerCase().includes(searchLower))
        );
      }).slice(0, 8); // Limit to 8 results
      
      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery, allResidents]);
  
  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Auto-expand Data-Match-It dropdown when on related page
  useEffect(() => {
    if (pathname === '/dashboard/data-match-it' || pathname === '/dashboard/bewonerslijst' || pathname === '/dashboard/keukenlijst') {
      setDataMatchItOpen(true);
    }
    if (pathname === '/dashboard/noord' || pathname === '/dashboard/zuid') {
      setKamersOpen(true);
    }
  }, [pathname]);
  
  // Global Escape key handler
  useEffect(() => {
    let lastFocusTime = Date.now();
    let returnGuardTimeout: number | undefined;
    
    // Track when window gains focus (e.g., returning from another tab)
    const handleFocus = () => {
      lastFocusTime = Date.now();
      
      // Check immediately
      try {
        const returnPath = sessionStorage.getItem('adminDocsReturnPath');
        const setAt = Number(sessionStorage.getItem('adminDocsReturnSetAt') || '0');
        const recentlySet = Date.now() - setAt < 5 * 60 * 1000; // 5 minutes
        
        if (returnPath && recentlySet) {
          // Keep the flags for delayed check
          const current = window.location.pathname;
          if (current !== returnPath) {
            router.push(returnPath);
            sessionStorage.removeItem('adminDocsReturnPath');
            sessionStorage.removeItem('adminDocsReturnSetAt');
          } else {
            // We're already on the right page, but check again after a delay
            // in case something redirects us
            setTimeout(() => {
              const delayedCurrent = window.location.pathname;
              const stillHasReturn = sessionStorage.getItem('adminDocsReturnPath');
              
              if (stillHasReturn && delayedCurrent !== returnPath) {
                router.push(returnPath);
              }
              
              // Clean up
              sessionStorage.removeItem('adminDocsReturnPath');
              sessionStorage.removeItem('adminDocsReturnSetAt');
            }, 500);
          }
        }
      } catch (e) {
        // Silently handle errors
      }
    };
    
    const handleEscapeKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Don't handle ESC on pages that have their own handler or when modals are open
        if (pathname === '/dashboard/weekend-permissie' || pathname === '/dashboard/administrative-documents') {
          return;
        }
        
        // Check if any modal is currently open by looking for modal elements
        const modalElement = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (modalElement) {
          // A modal is open, don't handle ESC here
          return;
        }
        
        // Don't handle ESC within 1 second of window gaining focus (prevents issues when returning from file view)
        if (Date.now() - lastFocusTime < 1000) {
          return;
        }
        
        if (showSearchResults) {
          // First press: close search results
          setShowSearchResults(false);
          setSearchQuery('');
        } else if (window.history.length > 1) {
          // Second press: go back to previous page
          router.back();
        }
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showSearchResults, router, pathname]);
  
  const handleSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Check if we're on Weekend Permissie page and have a search callback
      if (pathname === '/dashboard/weekend-permissie' && onResidentSearch && searchResults.length > 0) {
        // Use the first search result for Weekend Permissie page
        onResidentSearch(searchResults[0]);
        setSearchQuery('');
        setShowSearchResults(false);
      } else {
        // Navigate to bewonerslijst page with search query for other pages
        router.push(`/dashboard/bewonerslijst?search=${encodeURIComponent(searchQuery)}`);
        setSearchQuery('');
        setShowSearchResults(false);
      }
    }
  };
  
  const handleResultClick = (resident: any) => {
    // Check if we're on Weekend Permissie page and have a search callback
    if (pathname === '/dashboard/weekend-permissie' && onResidentSearch) {
      // Use the callback to handle resident selection on Weekend Permissie page
      onResidentSearch(resident);
      setSearchQuery('');
      setShowSearchResults(false);
    } else {
      // Navigate to bewonerslijst with the specific resident's name for other pages
      router.push(`/dashboard/bewonerslijst?search=${encodeURIComponent(resident.lastName)}`);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          /* Hide sidebar and navigation elements */
          .sidebar-mobile,
          .sidebar-desktop,
          .top-navigation {
            display: none !important;
          }
          
          /* Reset main content positioning for print */
          .main-content {
            margin-left: 0 !important;
            padding-left: 0 !important;
            width: 100% !important;
          }
          
          /* Hide background gradients for print */
          .print-bg-override {
            background: white !important;
          }
        }
      `}</style>
    <div className={`min-h-screen bg-background transition-colors duration-300 print-bg-override ${className || ''}`}>
      {/* Mobile sidebar */}
      {pathname !== '/dashboard/weekend-permissie' && (
      <div className={`sidebar-mobile fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-card shadow-2xl backdrop-blur-lg border-r border-border">
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
              <Sparkles className="h-6 w-6 text-primary mr-2" />
              <h2 className="text-lg font-bold text-foreground font-title">OOC Steenokkerzeel</h2>
            </Link>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-accent transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === item.href
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

            {/* Data-Match-It Dropdown */}
            <div className="space-y-1">
              <div className="flex items-center">
                <Link
                  href="/dashboard/data-match-it"
                  className={`group flex items-center flex-1 px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === '/dashboard/data-match-it' || pathname === '/dashboard/bewonerslijst' || pathname === '/dashboard/keukenlijst'
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Users className="mr-3 h-5 w-5" />
                  DATA-MATCH-IT
                </Link>
                <button
                  onClick={() => setDataMatchItOpen(!dataMatchItOpen)}
                  className={`p-2 text-sm rounded-md transition-colors ${
                    pathname === '/dashboard/data-match-it' || pathname === '/dashboard/bewonerslijst' || pathname === '/dashboard/keukenlijst'
                      ? 'text-accent-foreground'
                      : 'text-muted-foreground hover:text-accent-foreground'
                  }`}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${dataMatchItOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {dataMatchItOpen && (
                <div className="ml-6 space-y-1">
                  {dataMatchItItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                          pathname === item.href
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        <Icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* KAMERS Dropdown */}
            <div className="space-y-1">
              <button
                onClick={() => setKamersOpen(!kamersOpen)}
                className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  pathname === '/dashboard/noord' || pathname === '/dashboard/zuid'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <MapPin className="mr-3 h-5 w-5" />
                KAMERS
                <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${kamersOpen ? 'rotate-180' : ''}`} />
              </button>
              {kamersOpen && (
                <div className="ml-6 space-y-1">
                  {kamersItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                          pathname === item.href
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        <Icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Afspraken - Standalone item */}
            <Link
              href="/dashboard/appointments"
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === '/dashboard/appointments'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Calendar className="mr-3 h-5 w-5" />
              Afspraken
            </Link>

            {/* Bewoners Overzicht - Standalone item */}
            <Link
              href="/dashboard/residents-grid"
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === '/dashboard/residents-grid'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Grid3X3 className="mr-3 h-5 w-5" />
              Bewoners Overzicht
            </Link>

            {/* Weekend Permissie - Standalone item */}
            <Link
              href="/dashboard/weekend-permissie"
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === '/dashboard/weekend-permissie'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Calendar className="mr-3 h-5 w-5" />
              Weekend Permissie
            </Link>

            {/* Overzicht Jongeren - Standalone item */}
            <Link
              href="/dashboard/permissielijst"
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === '/dashboard/permissielijst'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <List className="mr-3 h-5 w-5" />
              Overzicht Jongeren
            </Link>

            {/* Administratieve Documenten - Standalone item */}
            <Link
              href="/dashboard/administrative-documents"
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === '/dashboard/administrative-documents'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <FileText className="mr-3 h-5 w-5" />
              Administratieve Documenten
            </Link>

            {/* Toewijzingen - Standalone item */}
            <Link
              href="/dashboard/toewijzingen"
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === '/dashboard/toewijzingen'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <UserCheck className="mr-3 h-5 w-5" />
              Toewijzingen
            </Link>
            
          </nav>
        </div>
      </div>
      )}

      {/* Desktop sidebar */}
      {pathname !== '/dashboard/weekend-permissie' && (
      <div className="sidebar-desktop hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto bg-card/80 backdrop-blur-xl border-r border-border shadow-xl">
          <div className="flex h-16 items-center px-4 border-b border-border">
            <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
              <Sparkles className="h-6 w-6 text-primary mr-2" />
              <h2 className="text-lg font-bold text-foreground font-title">OOC Steenokkerzeel</h2>
            </Link>
          </div>
          <nav className="flex-1 space-y-2 px-3 py-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-105'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 transition-colors`} />
                  {item.name}
                </Link>
              );
            })}

            {/* Data-Match-It Dropdown */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Link
                  href="/dashboard/data-match-it"
                  className={`group flex items-center flex-1 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                    pathname === '/dashboard/data-match-it' || pathname === '/dashboard/bewonerslijst' || pathname === '/dashboard/keukenlijst'
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-105'
                  }`}
                >
                  <Users className={`mr-3 h-5 w-5 transition-colors`} />
                  DATA-MATCH-IT
                </Link>
                <button
                  onClick={() => setDataMatchItOpen(!dataMatchItOpen)}
                  className={`p-2.5 text-sm rounded-xl transition-all duration-200 ${
                    pathname === '/dashboard/data-match-it' || pathname === '/dashboard/bewonerslijst' || pathname === '/dashboard/keukenlijst'
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:text-accent-foreground'
                  }`}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${dataMatchItOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {dataMatchItOpen && (
                <div className="ml-6 space-y-1">
                  {dataMatchItItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          pathname === item.href
                            ? 'bg-secondary text-secondary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        <Icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* KAMERS Dropdown */}
            <div className="space-y-2">
              <button
                onClick={() => setKamersOpen(!kamersOpen)}
                className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  pathname === '/dashboard/noord' || pathname === '/dashboard/zuid'
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-105'
                }`}
              >
                <MapPin className={`mr-3 h-5 w-5 transition-colors`} />
                KAMERS
                <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${kamersOpen ? 'rotate-180' : ''}`} />
              </button>
              {kamersOpen && (
                <div className="ml-6 space-y-1">
                  {kamersItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          pathname === item.href
                            ? 'bg-secondary text-secondary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        <Icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Afspraken - Standalone item */}
            <Link
              href="/dashboard/appointments"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                pathname === '/dashboard/appointments'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-105'
              }`}
            >
              <Calendar className={`mr-3 h-5 w-5 transition-colors`} />
              Afspraken
            </Link>

            {/* Bewoners Overzicht - Standalone item */}
            <Link
              href="/dashboard/residents-grid"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                pathname === '/dashboard/residents-grid'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-105'
              }`}
            >
              <Grid3X3 className={`mr-3 h-5 w-5 transition-colors`} />
              Bewoners Overzicht
            </Link>

            {/* Weekend Permissie - Standalone item */}
            <Link
              href="/dashboard/weekend-permissie"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                pathname === '/dashboard/weekend-permissie'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-105'
              }`}
            >
              <Calendar className={`mr-3 h-5 w-5 transition-colors`} />
              Weekend Permissie
            </Link>

            {/* Overzicht Jongeren - Standalone item */}
            <Link
              href="/dashboard/permissielijst"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                pathname === '/dashboard/permissielijst'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-105'
              }`}
            >
              <List className={`mr-3 h-5 w-5 transition-colors`} />
              Overzicht Jongeren
            </Link>

            {/* Administratieve Documenten - Standalone item */}
            <Link
              href="/dashboard/administrative-documents"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                pathname === '/dashboard/administrative-documents'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-105'
              }`}
            >
              <FileText className={`mr-3 h-5 w-5 transition-colors`} />
              Administratieve Documenten
            </Link>

            {/* Toewijzingen - Standalone item */}
            <Link
              href="/dashboard/toewijzingen"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                pathname === '/dashboard/toewijzingen'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-105'
              }`}
            >
              <UserCheck className={`mr-3 h-5 w-5 transition-colors`} />
              Toewijzingen
            </Link>
            
          </nav>
        </div>
      </div>
      )}

      {/* Main content */}
      <div className={`main-content ${pathname !== '/dashboard/weekend-permissie' ? 'lg:pl-64' : ''}`}>
        {/* Top bar */}
        <div className="top-navigation sticky top-0 z-40 flex h-16 bg-card/80 backdrop-blur-xl border-b border-border shadow-sm">
          {pathname !== '/dashboard/weekend-permissie' && (
          <button
            type="button"
            className="px-4 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          )}
          {pathname === '/dashboard/weekend-permissie' && (
          <button
            type="button"
            className="px-4 text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          )}
          <div className="flex flex-1 items-center justify-between px-4">
            <div className="flex flex-1 items-center">
              {pathname !== '/dashboard/residents-grid' && pathname !== '/dashboard/weekend-permissie' && (
                <div className="relative w-full max-w-md" ref={searchRef}>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  className="block w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring text-foreground backdrop-blur-sm transition-all"
                  placeholder="Zoek bewoners (min. 2 letters)... ESC = terug"
                />
                
                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full mt-2 w-full bg-popover rounded-xl shadow-2xl border border-border overflow-hidden z-50 max-h-96 overflow-y-auto">
                    <div className="p-2">
                      <div className="text-xs text-muted-foreground px-3 py-1 font-semibold">
                        {searchResults.length} resultaten gevonden
                      </div>
                      {searchResults.map((resident, index) => (
                        <button
                          key={`search-${resident.badge}-${index}`}
                          onClick={() => handleResultClick(resident)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-popover-foreground">
                                {resident.firstName} {resident.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Badge: {resident.badge} • Kamer: {resident.room || 'N/A'}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground group-hover:text-primary">
                              →
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="px-3 py-2 bg-muted text-xs text-muted-foreground border-t border-border">
                      <span className="font-semibold">Tip:</span> Druk Enter om alle resultaten te zien • ESC om te sluiten
                    </div>
                  </div>
                )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {mounted && (
                <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="relative p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-accent transition-all duration-200 hover:scale-105"
                >
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5 text-primary" />
                  ) : (
                    <Sun className="h-5 w-5 text-primary" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </button>
              )}
              <button className="relative p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-accent transition-all duration-200">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-primary-foreground bg-primary rounded-full ring-2 ring-background">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center text-sm text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-accent transition-all duration-200">
                    <UserCircle className="h-7 w-7" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground">
                      {user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive">
                    Uitloggen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 min-h-screen bg-background">
          <div className="p-1">
            {children}
          </div>
        </main>
      </div>
    </div>
    </>
  );
}
