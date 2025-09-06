'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '../components/layout/DashboardLayout';
import AddResidentModal from '../components/AddResidentModal';
import UploadDocModal from '../components/UploadDocModal';
import { useData } from "../../lib/DataContextWithAPI"; 
import { useAuth, withAuth } from "../../lib/AuthContext";
import { formatDateWithDay, getISOWeek } from '../../lib/utils';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Calendar,
  FileText,
  UserCheck,
  Grid3X3,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Bed,
  UserPlus,
  FileUp,
  Target
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

interface RecentActivity {
  id: string;
  type: 'checkin' | 'checkout' | 'document' | 'appointment';
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

function DashboardPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [displayStats, setDisplayStats] = useState<QuickStat[]>([]);
  
  const { dashboardStats, loading } = useData();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (dashboardStats) {
      // Create quick stats from available dashboard data
      const quickStats: QuickStat[] = [
        {
          label: 'Totale Bewoners',
          value: dashboardStats.totalResidents || 0,
          change: 0,
          trend: 'up',
          icon: <Users className="h-5 w-5" />,
          color: 'bg-blue-500'
        },
        {
          label: 'Bezette Kamers',
          value: dashboardStats.occupiedRooms || 0,
          change: 0,
          trend: 'up',
          icon: <Building2 className="h-5 w-5" />,
          color: 'bg-green-500'
        },
        {
          label: 'Beschikbare Kamers',
          value: dashboardStats.availableRooms || 0,
          change: 0,
          trend: 'down',
          icon: <Bed className="h-5 w-5" />,
          color: 'bg-purple-500'
        },
        {
          label: 'Bezettingsgraad',
          value: Math.round(dashboardStats.occupancyRate || 0),
          change: 0,
          trend: 'up',
          icon: <TrendingUp className="h-5 w-5" />,
          color: 'bg-orange-500'
        }
      ];
      
      setDisplayStats(quickStats);
    }

    // Keep recent activities simulation for now, can be replaced with API data later
    setRecentActivities([
      {
          id: '1',
          type: 'checkin',
          title: 'Nieuwe Bewoner',
          description: 'Ahmed M. ingecheckt in Noord K102',
          time: '10 minuten geleden',
          icon: <UserPlus className="h-4 w-4" />,
          color: 'bg-green-500'
        },
        {
          id: '2',
          type: 'document',
          title: 'Document Geüpload',
          description: 'Identiteitsdocument voor Sara K.',
          time: '25 minuten geleden',
          icon: <FileUp className="h-4 w-4" />,
          color: 'bg-blue-500'
        },
    ]);
  }, [dashboardStats]);

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
  
  if (loading || !dashboardStats) {
    return (
        <DashboardLayout>
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        </DashboardLayout>
    );
  }

  // Create occupancy structure from dashboardStats
  const totalOccupied = dashboardStats.occupiedRooms || 0;
  const totalBeds = dashboardStats.totalRooms || 50;
  const occupancyRate = dashboardStats.occupancyRate || 0;
  
  const occupancy = {
    total: {
      occupied: totalOccupied,
      beds: totalBeds,
      rate: occupancyRate
    },
    noord: {
      occupied: Math.floor(totalOccupied * 0.6), // Estimate 60% in Noord
      total: Math.floor(totalBeds * 0.6),
      rate: occupancyRate
    },
    zuid: {
      occupied: Math.floor(totalOccupied * 0.4), // Estimate 40% in Zuid
      total: Math.floor(totalBeds * 0.4),
      rate: occupancyRate
    },
    girls: {
      occupied: Math.floor(totalOccupied * 0.3), // Estimate 30% female
      total: Math.floor(totalBeds * 0.3)
    },
    minors: {
      occupied: Math.floor(totalOccupied * 0.15), // Estimate 15% minors
      total: Math.floor(totalBeds * 0.15)
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 p-6">
        {/* Hero Header */}
        <div className="mb-8 relative overflow-hidden">
        <div 
          className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-8 border border-white/50 dark:border-gray-700/50 shadow-2xl"
          style={{ backgroundImage: 'url(/images/feda.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent leading-tight">
                    Welkom Terug{user?.name ? `, ${user.name}` : ''}!
                  </h1>
                  <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 font-medium">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {displayStats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}{stat.label.includes('graad') ? '%' : ''}
                  </p>
                  <div className="mt-2 flex items-center">
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`ml-1 text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {Math.abs(stat.change)}%
                    </span>
                  </div>
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

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-8">
          {/* Occupancy Overview Card */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  Bezettingsoverzicht
                </h3>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-2 gap-6">
                  {/* Total Occupancy */}
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Totale Bezetting</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {occupancy.total.occupied} / {occupancy.total.beds}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500 flex items-center justify-center"
                        style={{ width: `${occupancy.total.rate}%` }}
                      >
                        <span className="text-xs text-white font-bold px-2">
                          {occupancy.total.rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Noord Building */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Noord Gebouw</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {occupancy.noord.occupied}/{occupancy.noord.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${occupancy.noord.rate}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Vrouwen: {occupancy.girls.occupied}/{occupancy.girls.total}
                    </p>
                  </div>
                  
                  {/* Zuid Building */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Zuid Gebouw</span>
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        {occupancy.zuid.occupied}/{occupancy.zuid.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-orange-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${occupancy.zuid.rate}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Minderjarigen: {occupancy.minors.occupied}/{occupancy.minors.total}
                    </p>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
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
          </div>
          
          {/* Recent Activities */}
          <div className="lg:col-span-1">
             <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Recente Activiteiten
                </h3>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className={`p-2 ${activity.color} rounded-lg text-white flex-shrink-0`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{activity.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
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
