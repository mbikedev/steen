'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '../components/layout/DashboardLayout';
import AddResidentModal from '../components/AddResidentModal';
import UploadDocModal from '../components/UploadDocModal';
import { useData } from "../../lib/DataContext"; 
import { useAuth, withAuth } from "../../lib/AuthContext";
import { formatDateWithDay, getISOWeek } from '../../lib/utils';
import { weekendPermissionsApi } from '../../lib/api-service';
import { 
  Users, 
  Building2, 
  Calendar,
  FileText,
  UserCheck,
  Grid3X3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Bed,
  UserPlus,
  Target,
  Bell,
  Clock,
  UserX,
  AlertTriangle
} from 'lucide-react';

// Type definitions remain the same...
interface QuickStat {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
}

interface Notification {
  id: string;
  type: 'new_resident' | 'late_return';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  resident?: any;
  day?: 'friday' | 'saturday' | 'sunday';
}


function DashboardPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [displayStats, setDisplayStats] = useState<QuickStat[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastResidentCount, setLastResidentCount] = useState(0);
  const [weekendPermissions, setWeekendPermissions] = useState<any[]>([]);
  
  const { dashboardStats, loading, occupancyStats, dataMatchIt } = useData();
  const { user } = useAuth();
  const router = useRouter();

  // Get current week in ISO format for weekend permissions
  const getCurrentWeek = () => {
    const now = new Date();
    const year = now.getFullYear();
    const start = new Date(year, 0, 1);
    const diff = now.getTime() - start.getTime();
    const weekNumber = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  };

  // Load weekend permissions for current week
  useEffect(() => {
    const loadWeekendPermissions = async () => {
      try {
        const currentWeek = getCurrentWeek();
        const result = await weekendPermissionsApi.getByWeek(currentWeek);
        if (result.success && result.data) {
          setWeekendPermissions(result.data);
        }
      } catch (error) {
        console.error('Error loading weekend permissions:', error);
      }
    };

    loadWeekendPermissions();
    // Reload permissions every 5 minutes to get updates
    const interval = setInterval(loadWeekendPermissions, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Use stats variable instead of dashboardStats directly
    const currentStats = dashboardStats || {
      totalResidents: 0,
      occupiedRooms: 0,
      availableRooms: 0,
      totalRooms: 70,
      occupancyRate: 0,
      recentActivities: []
    };
    
    // Create quick stats from available dashboard data
    const quickStats: QuickStat[] = [
      {
        label: 'Totale Bewoners',
        value: currentStats.totalResidents || 0,
        change: 0,
        trend: 'up',
        icon: <Users className="h-5 w-5" />,
        color: 'bg-blue-500'
      },
      {
        label: 'Beschikbare Kamers',
        value: occupancyStats?.availableBeds || 0,
        change: 0,
        trend: 'down',
        icon: <Bed className="h-5 w-5" />,
        color: 'bg-purple-500'
      }
    ];
    
    setDisplayStats(quickStats);
  }, [dashboardStats, occupancyStats]);

  // Monitor for new residents
  useEffect(() => {
    if (dataMatchIt && dataMatchIt.length > 0) {
      const currentCount = dataMatchIt.length;
      
      if (lastResidentCount > 0 && currentCount > lastResidentCount) {
        // New resident(s) detected
        const newResidents = dataMatchIt.slice(-Math.abs(currentCount - lastResidentCount));
        
        newResidents.forEach(resident => {
          const newNotification: Notification = {
            id: `new-resident-${resident.id}-${Date.now()}`,
            type: 'new_resident',
            title: 'Nieuwe Bewoner Toegevoegd',
            message: `${resident.first_name} ${resident.last_name} is toegevoegd aan het systeem`,
            timestamp: new Date(),
            read: false,
            resident
          };
          
          setNotifications(prev => [newNotification, ...prev]);
        });
      }
      
      setLastResidentCount(currentCount);
    }
  }, [dataMatchIt, lastResidentCount]);

  // Get current day name in Dutch
  const getCurrentDayName = (): 'friday' | 'saturday' | 'sunday' | null => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    switch (dayOfWeek) {
      case 5: return 'friday';   // Friday
      case 6: return 'saturday'; // Saturday  
      case 0: return 'sunday';   // Sunday
      default: return null;
    }
  };

  // Function to manually trigger late return notification for specific badge and day
  const triggerLateReturnNotification = (badgeNumber: string, specificDay?: 'friday' | 'saturday' | 'sunday') => {
    if (!dataMatchIt || !weekendPermissions) return;
    
    const resident = dataMatchIt.find(r => r.badge.toString() === badgeNumber);
    if (!resident) {
      console.log(`Resident with badge ${badgeNumber} not found`);
      return;
    }

    // Find the resident's weekend permission
    const permission = weekendPermissions.find(p => p.badge === badgeNumber);
    if (!permission) {
      console.log(`No weekend permission found for badge ${badgeNumber}`);
      return;
    }

    const currentDay = specificDay || getCurrentDayName();
    if (!currentDay) {
      console.log('Not a weekend day');
      return;
    }

    // Check if the resident has Dagpermissie for this specific day
    const dayPermissionType = permission[`${currentDay}_type`];
    if (dayPermissionType !== 'daily') {
      console.log(`Badge ${badgeNumber} does not have Dagpermissie for ${currentDay}`);
      return;
    }

    // Check if we already have a late notification for this resident and this specific day today
    const today = new Date().toDateString();
    const existingNotification = notifications.find(n => 
      n.type === 'late_return' && 
      n.resident?.badge.toString() === badgeNumber &&
      n.day === currentDay &&
      n.timestamp.toDateString() === today
    );
    
    if (existingNotification) {
      console.log(`Late return notification already exists for badge ${badgeNumber} on ${currentDay} today`);
      return;
    }
    
    const dayNames = {
      friday: 'vrijdag',
      saturday: 'zaterdag', 
      sunday: 'zondag'
    };

    const lateNotification: Notification = {
      id: `late-return-${resident.id}-${currentDay}-${Date.now()}`,
      type: 'late_return',
      title: 'Te Laat Teruggekeerd',
      message: `${resident.first_name} ${resident.last_name} (Badge: ${resident.badge}) is te laat terug van ${dayNames[currentDay]} dagpermissie`,
      timestamp: new Date(),
      read: false,
      resident,
      day: currentDay
    };
    
    setNotifications(prev => [lateNotification, ...prev]);
    console.log(`Late return notification created for ${resident.first_name} ${resident.last_name} on ${currentDay}`);
  };

  // Monitor for late returns from weekend permissions
  useEffect(() => {
    const checkLateReturns = () => {
      if (!weekendPermissions || !dataMatchIt) return;

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
      const currentDay = getCurrentDayName();
      
      // Only check on weekend days and after 22:00 (1320 minutes)
      if (!currentDay || currentTime < 1320) return;

      console.log(`Checking late returns for ${currentDay} at ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);

      // Check all residents with Dagpermissie for the current day
      weekendPermissions.forEach(permission => {
        const dayPermissionType = permission[`${currentDay}_type`];
        
        // Only check residents with Dagpermissie for this day
        if (dayPermissionType === 'daily') {
          const resident = dataMatchIt.find(r => r.badge.toString() === permission.badge);
          
          if (resident) {
            // Check if we already have a late notification for this resident and day today
            const today = now.toDateString();
            const existingNotification = notifications.find(n => 
              n.type === 'late_return' && 
              n.resident?.badge.toString() === permission.badge &&
              n.day === currentDay &&
              n.timestamp.toDateString() === today
            );
            
            // Check if they haven't returned yet (no arrival time recorded or status not "OK")
            const hasNotReturned = !permission.actual_arrival_time || permission.status !== 'OK';
            
            if (!existingNotification && hasNotReturned) {
              const dayNames = {
                friday: 'vrijdag',
                saturday: 'zaterdag', 
                sunday: 'zondag'
              };

              const lateNotification: Notification = {
                id: `late-return-${resident.id}-${currentDay}-${Date.now()}`,
                type: 'late_return',
                title: 'Te Laat Teruggekeerd',
                message: `${resident.first_name} ${resident.last_name} (Badge: ${resident.badge}) is te laat terug van ${dayNames[currentDay]} dagpermissie`,
                timestamp: now,
                read: false,
                resident,
                day: currentDay
              };
              
              setNotifications(prev => [lateNotification, ...prev]);
              console.log(`Late return notification created for ${resident.first_name} ${resident.last_name} on ${currentDay}`);
            }
          }
        }
      });
    };

    // Check every minute
    const interval = setInterval(checkLateReturns, 60000);
    
    // Also check immediately when permissions are loaded
    if (weekendPermissions.length > 0) {
      setTimeout(checkLateReturns, 1000);
    }
    
    return () => clearInterval(interval);
  }, [weekendPermissions, dataMatchIt, notifications]);

  // Expose function globally for testing
  useEffect(() => {
    (window as any).triggerLateReturn = triggerLateReturnNotification;
  }, [dataMatchIt, notifications]);

  const handleAddResident = (newResident: any) => {
    console.log('New resident added:', newResident);
    setIsAddModalOpen(false);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      console.log('Files uploaded:', Array.from(files).map(f => f.name));
      setIsUploadModalOpen(false);
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadNotifications = notifications.filter(n => !n.read);

  // Navigation cards configuration
  const navigationCards = [
    {
      title: 'Bedden Beheer',
      description: 'Beheer kamer toewijzingen',
      icon: <Bed className="h-6 w-6" />,
      href: '/dashboard/bed-management',
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'from-blue-50 to-cyan-100 dark:from-blue-950/50 dark:to-cyan-950/50'
    },
    {
      title: 'Bewoners Grid',
      description: 'Visueel foto overzicht',
      icon: <Grid3X3 className="h-6 w-6" />,
      href: '/dashboard/residents-grid',
      color: 'from-emerald-500 to-green-600',
      bgColor: 'from-emerald-50 to-green-100 dark:from-emerald-950/50 dark:to-green-950/50'
    },
    {
      title: 'Data Match-IT',
      description: 'Synchroniseer gegevens',
      icon: <Activity className="h-6 w-6" />,
      href: '/dashboard/data-match-it',
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'from-purple-50 to-indigo-100 dark:from-purple-950/50 dark:to-indigo-950/50'
    },
    {
      title: 'Afspraken',
      description: 'Beheer afspraken',
      icon: <Calendar className="h-6 w-6" />,
      href: '/dashboard/appointments',
      color: 'from-orange-500 to-amber-600',
      bgColor: 'from-orange-50 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/50'
    },
    {
      title: 'Toewijzingen',
      description: 'Staff toewijzingen',
      icon: <UserCheck className="h-6 w-6" />,
      href: '/dashboard/toewijzingen',
      color: 'from-pink-500 to-rose-600',
      bgColor: 'from-pink-50 to-rose-100 dark:from-pink-950/50 dark:to-rose-950/50'
    },
    {
      title: 'Documenten',
      description: 'Administratieve docs',
      icon: <FileText className="h-6 w-6" />,
      href: '/dashboard/administrative-documents',
      color: 'from-teal-500 to-cyan-600',
      bgColor: 'from-teal-50 to-cyan-100 dark:from-teal-950/50 dark:to-cyan-950/50'
    }
  ];
  
  if (loading) {
    return (
        <DashboardLayout>
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        </DashboardLayout>
    );
  }
  

  return (
    <DashboardLayout notificationCount={unreadNotifications.length}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 p-6">
        {/* Hero Header */}
        <div className="mb-8 relative overflow-hidden">
        <div 
          className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 dark:border-gray-700/50 shadow-2xl min-h-[300px]"
          style={{ backgroundImage: 'url(/images/steenok.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                  <h1 className="text-4xl font-bold text-white">
                    Welkom Terug{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
                  </h1>
                  <p className="mt-3 text-lg text-white dark:text-gray-300 font-medium">
                    OOC Steenokkerzeel Management Dashboard
                  </p>
              </div>
              <div className="text-right bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50 rounded-2xl p-6 border border-indigo-200/50 dark:border-indigo-700/50">
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    {formatDateWithDay(new Date())}
                  </p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                    Week {getISOWeek(new Date())}
                  </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {displayStats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 bg-gradient-to-br ${
                  stat.color === 'emerald' ? 'from-emerald-400 to-green-600' :
                  stat.color === 'blue' ? 'from-blue-400 to-cyan-600' :
                  stat.color === 'purple' ? 'from-purple-400 to-indigo-600' :
                  'from-orange-400 to-amber-600'
                } rounded-xl shadow-lg text-white`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                Snelle Acties
              </h3>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <UserPlus className="h-5 w-5" />
                  <span className="font-semibold">Nieuwe Bewoner</span>
                </button>
                <button 
                  onClick={() => router.push('/dashboard/bed-management')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Bed className="h-5 w-5" />
                  <span className="font-semibold">Bedden Beheer</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Bell className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  Notificaties
                  {unreadNotifications.length > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {unreadNotifications.length}
                    </span>
                  )}
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => triggerLateReturnNotification('25176', 'friday')}
                    className="text-xs px-2 py-1 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium border border-orange-300 rounded"
                  >
                    Test Vrijdag (25176)
                  </button>
                  <button
                    onClick={() => triggerLateReturnNotification('25176', 'saturday')}
                    className="text-xs px-2 py-1 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium border border-orange-300 rounded"
                  >
                    Test Zaterdag (25176)
                  </button>
                  <button
                    onClick={() => triggerLateReturnNotification('25176', 'sunday')}
                    className="text-xs px-2 py-1 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium border border-orange-300 rounded"
                  >
                    Test Zondag (25176)
                  </button>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                    >
                      Alles Wissen
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="p-8">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">Geen nieuwe notificaties</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Je wordt op de hoogte gehouden van nieuwe bewoners en late terugkeer
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-md cursor-pointer ${
                        notification.read
                          ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                          : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          notification.type === 'new_resident' 
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                            : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                        }`}>
                          {notification.type === 'new_resident' ? (
                            <UserPlus className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {notification.title}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                              {notification.timestamp.toLocaleTimeString('nl-NL', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {notification.message}
                          </p>
                          {notification.resident && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Badge: {notification.resident.badge} | Kamer: {notification.resident.room || 'Niet toegewezen'}
                              {notification.day && (
                                <span className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                                  {notification.day === 'friday' ? 'Vrijdag' : 
                                   notification.day === 'saturday' ? 'Zaterdag' : 'Zondag'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Cards Grid */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200/50 dark:border-gray-600/50">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Target className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                Snelle Navigatie
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Direct naar belangrijke functies</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {navigationCards.map((card, index) => (
                  <Link
                    key={index}
                    href={card.href}
                    className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.bgColor} border border-gray-200/50 dark:border-gray-700/30 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 bg-gradient-to-br ${card.color} rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 text-white`}>
                        {card.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{card.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{card.description}</p>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <AddResidentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddResident}
        />

        <UploadDocModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleFileUpload}
        />
      </div>
    </DashboardLayout>
  );
}

export default withAuth(DashboardPage);
