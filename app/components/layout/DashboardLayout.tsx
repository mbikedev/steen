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
  { name: 'Administratieve Documenten', href: '/dashboard/administrative-documents', icon: FileText },
  { name: 'Bedden Beheer', href: '/dashboard/bed-management', icon: Bed },
  { name: 'Overzicht Jongeren', href: '/dashboard/permissielijst', icon: List },
  { name: 'Bewoners Overzicht', href: '/dashboard/residents-grid', icon: Grid3X3 },
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
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 transition-colors duration-300 print-bg-override ${className || ''}`}>
      {/* Mobile sidebar */}
      {pathname !== '/dashboard/weekend-permissie' && (
      <div className={`sidebar-mobile fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800 shadow-2xl backdrop-blur-lg">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
              <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent font-title">OOC Steenokkerzeel</h2>
            </div>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
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
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                >
                  <Users className="mr-3 h-5 w-5" />
                  DATA-MATCH-IT
                </Link>
                <button
                  onClick={() => setDataMatchItOpen(!dataMatchItOpen)}
                  className={`p-2 text-sm rounded-md transition-colors ${
                    pathname === '/dashboard/data-match-it' || pathname === '/dashboard/bewonerslijst' || pathname === '/dashboard/keukenlijst'
                      ? 'text-blue-900 dark:text-blue-100'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
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
                            ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
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
                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
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
                            ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
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
            
            {/* Toewijzingen - Standalone item */}
            <Link
              href="/dashboard/toewijzingen"
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === '/dashboard/toewijzingen'
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
              }`}
            >
              <UserCheck className="mr-3 h-5 w-5" />
              Toewijzingen
            </Link>
            
            {/* Weekend Permissie - Standalone item */}
            <Link
              href="/dashboard/weekend-permissie"
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === '/dashboard/weekend-permissie'
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
              }`}
            >
              <Calendar className="mr-3 h-5 w-5" />
              Weekend Permissie
            </Link>
            
            {/* Afspraken - Standalone item */}
            <Link
              href="/dashboard/appointments"
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                pathname === '/dashboard/appointments'
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
              }`}
            >
              <Calendar className="mr-3 h-5 w-5" />
              Afspraken
            </Link>
          </nav>
        </div>
      </div>
      )}

      {/* Desktop sidebar */}
      {pathname !== '/dashboard/weekend-permissie' && (
      <div className="sidebar-desktop hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-600/50 shadow-xl">
          <div className="flex h-16 items-center px-4 border-b border-gray-200/50 dark:border-gray-600/50">
            <div className="flex items-center">
              <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
              <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent font-title">OOC Steenokkerzeel</h2>
            </div>
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
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-600/30'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white hover:scale-105'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 transition-colors ${pathname === item.href ? 'text-white' : 'text-current'}`} />
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
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-600/30'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white hover:scale-105'
                  }`}
                >
                  <Users className={`mr-3 h-5 w-5 transition-colors ${pathname === '/dashboard/data-match-it' || pathname === '/dashboard/bewonerslijst' || pathname === '/dashboard/keukenlijst' ? 'text-white' : 'text-current'}`} />
                  DATA-MATCH-IT
                </Link>
                <button
                  onClick={() => setDataMatchItOpen(!dataMatchItOpen)}
                  className={`p-2.5 text-sm rounded-xl transition-all duration-200 ${
                    pathname === '/dashboard/data-match-it' || pathname === '/dashboard/bewonerslijst' || pathname === '/dashboard/keukenlijst'
                      ? 'text-white'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white'
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
                            ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
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
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-600/30'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white hover:scale-105'
                }`}
              >
                <MapPin className={`mr-3 h-5 w-5 transition-colors ${pathname === '/dashboard/noord' || pathname === '/dashboard/zuid' ? 'text-white' : 'text-current'}`} />
                KAMERS
                <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${kamersOpen ? 'rotate-180' : ''} ${pathname === '/dashboard/noord' || pathname === '/dashboard/zuid' ? 'text-white' : 'text-current'}`} />
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
                            ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
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
            
            {/* Toewijzingen - Standalone item */}
            <Link
              href="/dashboard/toewijzingen"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                pathname === '/dashboard/toewijzingen'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-600/30'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white hover:scale-105'
              }`}
            >
              <UserCheck className={`mr-3 h-5 w-5 transition-colors ${pathname === '/dashboard/toewijzingen' ? 'text-white' : 'text-current'}`} />
              Toewijzingen
            </Link>
            
            {/* Weekend Permissie - Standalone item */}
            <Link
              href="/dashboard/weekend-permissie"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                pathname === '/dashboard/weekend-permissie'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-600/30'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white hover:scale-105'
              }`}
            >
              <Calendar className={`mr-3 h-5 w-5 transition-colors ${pathname === '/dashboard/weekend-permissie' ? 'text-white' : 'text-current'}`} />
              Weekend Permissie
            </Link>
            
            {/* Afspraken - Standalone item */}
            <Link
              href="/dashboard/appointments"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                pathname === '/dashboard/appointments'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-600/30'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white hover:scale-105'
              }`}
            >
              <Calendar className={`mr-3 h-5 w-5 transition-colors ${pathname === '/dashboard/appointments' ? 'text-white' : 'text-current'}`} />
              Afspraken
            </Link>
          </nav>
        </div>
      </div>
      )}

      {/* Main content */}
      <div className={`main-content ${pathname !== '/dashboard/weekend-permissie' ? 'lg:pl-64' : ''}`}>
        {/* Top bar */}
        <div className="top-navigation sticky top-0 z-40 flex h-16 bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-600/50 shadow-sm">
          {pathname !== '/dashboard/weekend-permissie' && (
          <button
            type="button"
            className="px-4 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          )}
          {pathname === '/dashboard/weekend-permissie' && (
          <button
            type="button"
            className="px-4 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 transition-colors"
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
                  <Search className="h-5 w-5 text-gray-400 dark:text-gray-400" />
                </div>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  className="block w-full rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-700/70 py-2.5 pl-10 pr-3 text-sm placeholder-gray-500 dark:placeholder-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-black dark:text-gray-100 backdrop-blur-sm transition-all"
                  placeholder="Zoek bewoners (min. 2 letters)... ESC = terug"
                />
                
                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 max-h-96 overflow-y-auto">
                    <div className="p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1 font-semibold">
                        {searchResults.length} resultaten gevonden
                      </div>
                      {searchResults.map((resident, index) => (
                        <button
                          key={`search-${resident.badge}-${index}`}
                          onClick={() => handleResultClick(resident)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {resident.firstName} {resident.lastName}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Badge: {resident.badge} • Kamer: {resident.room || 'N/A'}
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              →
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
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
                  className="relative p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
                >
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5 text-blue-500" />
                  ) : (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </button>
              )}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-gradient-to-r from-red-400 to-pink-500 rounded-full ring-2 ring-white dark:ring-gray-800">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center text-sm text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
                    <UserCircle className="h-7 w-7" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-red-600 dark:text-red-400">
                    Uitloggen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 min-h-screen bg-gradient-to-br from-slate-50/50 to-blue-50/30 dark:from-gray-900/30 dark:to-slate-900/50">
          <div className="p-1">
            {children}
          </div>
        </main>
      </div>
    </div>
    </>
  );
}
