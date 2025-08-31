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
  Grid3X3
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useData } from "../../../lib/DataContextDebug";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Bewonerslijst', href: '/dashboard/bewonerslijst', icon: List },
  { name: 'Keukenlijst', href: '/dashboard/keukenlijst', icon: ChefHat },
  { name: 'Noord', href: '/dashboard/noord', icon: MapPin },
  { name: 'Zuid', href: '/dashboard/zuid', icon: MapPin },
  { name: 'Data-Match-It', href: '/dashboard/data-match-it', icon: Users },
  { name: 'Residents Grid', href: '/dashboard/residents-grid', icon: Grid3X3 },
  { name: 'Bedden Beheer', href: '/dashboard/bed-management', icon: Bed },
  { name: 'Afspraken', href: '/dashboard/appointments', icon: Calendar },
  { name: 'Permissielijst', href: '/dashboard/permissielijst', icon: List },
  { name: 'Toewijzingen', href: '/dashboard/toewijzingen', icon: UserCheck },
];

export default function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { bewonerslijst, dataMatchIt } = useData();
  
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
          resident.lastName.toLowerCase().includes(searchLower) ||
          resident.firstName.toLowerCase().includes(searchLower) ||
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
  
  // Global Escape key handler
  useEffect(() => {
    const handleEscapeKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
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
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [showSearchResults, router]);
  
  const handleSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Navigate to bewonerslijst page with search query
      router.push(`/dashboard/bewonerslijst?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };
  
  const handleResultClick = (resident: any) => {
    // Navigate to bewonerslijst with the specific resident's name
    router.push(`/dashboard/bewonerslijst?search=${encodeURIComponent(resident.lastName)}`);
    setSearchQuery('');
    setShowSearchResults(false);
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
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
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
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content lg:pl-64">
        {/* Top bar */}
        <div className="top-navigation sticky top-0 z-40 flex h-16 bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-600/50 shadow-sm">
          <button
            type="button"
            className="px-4 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 items-center justify-between px-4">
            <div className="flex flex-1 items-center">
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
            </div>
            <div className="flex items-center space-x-3">
              {mounted && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105">
                      {theme === 'dark' ? (
                        <Moon className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Sun className="h-5 w-5 text-yellow-500" />
                      )}
                      <span className="sr-only">Toggle theme</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                      <Sun className="mr-2 h-4 w-4" />
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                      <Moon className="mr-2 h-4 w-4" />
                      Dark
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-gradient-to-r from-red-400 to-pink-500 ring-2 ring-white dark:ring-gray-800 animate-pulse" />
              </button>
              <button className="flex items-center text-sm text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
                <UserCircle className="h-7 w-7" />
              </button>
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
