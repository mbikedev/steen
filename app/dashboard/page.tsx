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



function DashboardPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [displayStats, setDisplayStats] = useState<QuickStat[]>([]);
  const [weekendPermissions, setWeekendPermissions] = useState<any[]>([]);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
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

  // Timeout fallback to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadingTimeout(true);
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, []);

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
    const totalResidentsCount = Array.isArray(dataMatchIt)
      ? dataMatchIt.length
      : currentStats.totalResidents || 0;

    const quickStats: QuickStat[] = [
      {
        label: 'Totale Bewoners',
        value: totalResidentsCount,
        change: 0,
        trend: 'up',
        icon: <Users className="h-5 w-5" />,
        color: 'bg-primary'
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
  }, [dashboardStats, occupancyStats, dataMatchIt, loadingTimeout]);






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
      color: 'from-primary to-primary/80',
      bgColor: 'from-accent to-accent/50'
    },
    {
      title: 'Bewoners Grid',
      description: 'Visueel foto overzicht',
      icon: <Grid3X3 className="h-6 w-6" />,
      href: '/dashboard/residents-grid',
      color: 'from-primary to-primary/80',
      bgColor: 'from-accent to-accent/50'
    },
    {
      title: 'Data Match-IT',
      description: 'Synchroniseer gegevens',
      icon: <Activity className="h-6 w-6" />,
      href: '/dashboard/data-match-it',
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'from-purple-50 to-indigo-100 dark:to-indigo-950/50'
    },
    {
      title: 'Afspraken',
      description: 'Beheer afspraken',
      icon: <Calendar className="h-6 w-6" />,
      href: '/dashboard/appointments',
      color: 'from-primary to-primary/80',
      bgColor: 'from-accent to-accent/50'
    },
    {
      title: 'Toewijzingen',
      description: 'Staff toewijzingen',
      icon: <UserCheck className="h-6 w-6" />,
      href: '/dashboard/toewijzingen',
      color: 'from-pink-500 to-rose-600',
      bgColor: 'from-pink-50 to-rose-100 dark:to-rose-950/50'
    },
    {
      title: 'Documenten',
      description: 'Administratieve docs',
      icon: <FileText className="h-6 w-6" />,
      href: '/dashboard/administrative-documents',
      color: 'from-teal-500 to-cyan-600',
      bgColor: 'from-teal-50 to-cyan-100 dark:to-cyan-950/50'
    }
  ];
  
  // Show loading only for initial load, not when returning to dashboard
  if (loading && !dashboardStats && displayStats.length === 0 && !loadingTimeout) {
    return (
        <DashboardLayout>
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        </DashboardLayout>
    );
  }
  

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background p-6">
        {/* Hero Header */}
        <div className="mb-8 relative overflow-hidden">
        <div 
          className="relative bg-card/70 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl min-h-[300px]"
          style={{ backgroundImage: 'url(/images/steenok.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                  <h1 className="text-4xl font-bold text-white">
                    Welkom Terug{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
                  </h1>
                  <p className="mt-3 text-lg text-white font-medium">
                    OOC Steenokkerzeel Management Dashboard
                  </p>
              </div>
              <div className="text-right bg-secondary rounded-2xl p-6 border border-border">
                  <p className="text-2xl font-bold text-secondary-foreground">
                    {formatDateWithDay(new Date())}
                  </p>
                  <p className="text-sm text-muted-foreground font-semibold mt-1">
                    Week {getISOWeek(new Date())}
                  </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {displayStats.map((stat, index) => (
            <div key={index} className="bg-card rounded-2xl shadow-xl p-6 border border-border hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-card-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 bg-gradient-to-br ${
                  stat.color === 'emerald' ? 'from-primary to-primary/80' :
                  stat.color === 'blue' ? 'from-primary to-primary/80' :
                  stat.color === 'purple' ? 'from-purple-400 to-indigo-600' :
                  stat.color === 'bg-primary' ? 'from-primary to-primary/80' :
                  'from-primary to-primary/80'
                } rounded-xl shadow-lg text-primary-foreground`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-card rounded-3xl shadow-2xl border border-border overflow-hidden">
            <div className="px-8 py-6 border-b border-border bg-muted">
              <h3 className="text-2xl font-bold text-card-foreground flex items-center gap-3">
                <Building2 className="h-6 w-6 text-primary" />
                Snelle Acties
              </h3>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <UserPlus className="h-5 w-5" />
                  <span className="font-semibold">Nieuwe Bewoner</span>
                </button>
                <button 
                  onClick={() => router.push('/dashboard/bed-management')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Bed className="h-5 w-5" />
                  <span className="font-semibold">Bedden Beheer</span>
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Navigation Cards Grid */}
        <div className="mb-8">
          <div className="bg-card rounded-3xl shadow-2xl border border-border overflow-hidden">
            <div className="px-8 py-6 border-b border-border">
              <h3 className="text-2xl font-bold text-card-foreground flex items-center gap-3">
                <Target className="h-6 w-6 text-primary" />
                Snelle Navigatie
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Direct naar belangrijke functies</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {navigationCards.map((card, index) => (
                  <Link
                    key={index}
                    href={card.href}
                    className={`group relative overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 bg-gradient-to-br ${card.color} rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 text-primary-foreground`}>
                        {card.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-card-foreground">{card.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
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
