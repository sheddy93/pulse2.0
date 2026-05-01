import { useState, useEffect } from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContextDecoupled';
import { employeeService } from '@/services/employeeService';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import { Clock, Calendar, FileText, BarChart3, MessageSquare, Heart, GraduationCap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const TRANSLATIONS = {
  it: {
    greeting: 'Ciao',
    today: 'Oggi',
    presence: 'Presenze',
    checkIn: 'Timbrato',
    waiting: 'In attesa',
    workTime: 'Tempo Lavoro',
    availableLeave: 'Ferie Disponibili',
    permissions: 'Permessi',
    nextShift: 'Prossimo Turno',
    shiftCalendar: 'Visualizza calendario',
    attendance: 'Timbratura',
    attendanceDesc: 'Check-in/out con GPS',
    shifts: 'I Miei Turni',
    shiftsDesc: 'Calendario personalizzato',
    leave: 'Ferie',
    leaveDesc: 'Richieste e saldo',
    training: 'Formazione',
    trainingDesc: 'Corsi e certificati',
    documents: 'Documenti',
    documentsDesc: 'Contratto e allegati',
    feedback: 'Feedback',
    feedbackDesc: 'Valutazioni ricevute',
    discover: 'Scopri tutte le funzionalità',
    manageFeatures: 'Gestisci le tue presenze, richiedi ferie, accedi ai corsi di formazione e molto altro',
    exploreDashboard: 'Esplora Dashboard Completa'
  },
  en: {
    greeting: 'Hello',
    today: 'Today',
    presence: 'Attendance',
    checkIn: 'Checked In',
    waiting: 'Waiting',
    workTime: 'Work Time',
    availableLeave: 'Available Days Off',
    permissions: 'Permissions',
    nextShift: 'Next Shift',
    shiftCalendar: 'View calendar',
    attendance: 'Attendance',
    attendanceDesc: 'Check-in/out with GPS',
    shifts: 'My Shifts',
    shiftsDesc: 'Personal calendar',
    leave: 'Time Off',
    leaveDesc: 'Requests & balance',
    training: 'Training',
    trainingDesc: 'Courses & certificates',
    documents: 'Documents',
    documentsDesc: 'Contract & attachments',
    feedback: 'Feedback',
    feedbackDesc: 'Received reviews',
    discover: 'Discover all features',
    manageFeatures: 'Manage your attendance, request time off, access training courses and much more',
    exploreDashboard: 'Explore Full Dashboard'
  }
};

export default function EmployeeDashboardOptimized() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upcomingShift, setUpcomingShift] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [todayStats, setTodayStats] = useState(null);
  const [lang, setLang] = useState(localStorage.getItem('language') || 'it');
  const t = (key) => TRANSLATIONS[lang]?.[key] || key;

  useEffect(() => {
    if (!isLoadingAuth && authUser?.email) {
      const loadData = async () => {

        const emps = await employeeService.listEmployees(authUser.company_id, { email: authUser.email });
        
        if (emps?.[0]) setEmployee(emps[0]);
        if (emps?.[0]) setLeaveBalance({ available_leave: 20, available_permissions: 8 });

        // TODO: Integrate with shift/attendance services
        setUpcomingShift(null);
        setTodayStats({
          checkedIn: false,
          totalTime: '0h',
          entriesCount: 0
        });
      } catch (err) {
        console.error('Error loading employee data:', err);
      } finally {
        setLoading(false);
      }
      };
      loadData();
    } else if (!isLoadingAuth) {
      setLoading(false);
    }
  }, [authUser, isLoadingAuth]);

  const calculateTotalTime = (entries) => {
    let total = 0;
    let lastCheckIn = null;

    entries.forEach(e => {
      if (e.type === 'check_in') {
        lastCheckIn = new Date(e.timestamp);
      } else if (e.type === 'check_out' && lastCheckIn) {
        total += (new Date(e.timestamp) - lastCheckIn) / (1000 * 60);
        lastCheckIn = null;
      }
    });

    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return `${hours}h ${Math.round(mins)}m`;
  };

  if (loading) return <PageLoader color="green" />;

  const quickLinks = [
  { label: t('attendance'), desc: t('attendanceDesc'), icon: Clock, path: '/dashboard/employee/attendance', color: 'from-emerald-500 to-teal-600' },
  { label: t('shifts'), desc: t('shiftsDesc'), icon: Calendar, path: '/dashboard/employee/shifts', color: 'from-orange-500 to-red-600' },
  { label: t('leave'), desc: t('leaveDesc'), icon: Calendar, path: '/dashboard/employee/leave', color: 'from-blue-500 to-indigo-600' },
  { label: 'Messaggi', desc: 'Chat con HR', icon: MessageSquare, path: '/dashboard/employee/messaging', color: 'from-pink-500 to-rose-600' },
  { label: t('training'), desc: t('trainingDesc'), icon: GraduationCap, path: '/dashboard/employee/training', color: 'from-purple-500 to-pink-600' },
  { label: t('documents'), desc: t('documentsDesc'), icon: FileText, path: '/dashboard/employee/documents', color: 'from-slate-500 to-slate-700' },
  { label: t('feedback'), desc: t('feedbackDesc'), icon: BarChart3, path: '/dashboard/employee/feedback', color: 'from-yellow-500 to-orange-600' }
  ];

  return (
    <AppShell user={authUser}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">
                   {t('greeting')}, {authUser?.full_name?.split(' ')[0]}! 👋
                 </h1>
              <p className="text-slate-600 dark:text-slate-400">{new Date().toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            <select
              value={lang}
              onChange={(e) => {
                setLang(e.target.value);
                localStorage.setItem('language', e.target.value);
              }}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm cursor-pointer"
            >
              <option value="it">🇮🇹 Italiano</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </motion.div>

          {/* Quick Stats - Mobile optimized */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
          >
            {[
              { label: t('presence'), value: todayStats?.checkedIn ? `✓ ${t('checkIn')}` : `⏳ ${t('waiting')}`, color: 'emerald' },
              { label: t('workTime'), value: todayStats?.totalTime || '0h', color: 'blue' },
              { label: t('availableLeave'), value: `${leaveBalance?.available_leave || 0}gg`, color: 'purple' },
              { label: t('permissions'), value: `${leaveBalance?.available_permissions || 0}gg`, color: 'orange' }
            ].map((stat, i) => (
              <div
                key={i}
                className={`p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow`}
              >
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">{stat.label}</p>
                <p className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Upcoming Shift Alert */}
          {upcomingShift && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-5 md:p-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 rounded-xl space-y-3"
            >
              <h3 className="font-semibold text-orange-900 dark:text-orange-200 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('nextShift')}
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-orange-800 dark:text-orange-300">
                  📅 {new Date(upcomingShift.shift_date).toLocaleDateString('it-IT')}
                </p>
                <p className="text-orange-800 dark:text-orange-300">
                  ⏰ {upcomingShift.start_time} - {upcomingShift.end_time}
                </p>
                <p className="text-orange-800 dark:text-orange-300">
                  📍 {upcomingShift.location_name}
                </p>
              </div>
              <Link
                to="/dashboard/employee/shifts"
                className="inline-flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-200 hover:text-orange-900 dark:hover:text-orange-100 mt-2"
              >
                {t('shiftCalendar')} <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}

          {/* Quick Actions Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4"
          >
            {quickLinks.map((link, i) => {
              const Icon = link.icon;
              return (
                <Link
                  key={i}
                  to={link.path}
                  className={`p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all group`}
                >
                  <div className={`bg-gradient-to-br ${link.color} w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-2 md:mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 md:w-6 h-5 md:h-6 text-white" />
                  </div>
                  <p className="text-xs md:text-sm font-medium text-slate-800 dark:text-white text-center line-clamp-2">
                    {link.label}
                  </p>
                </Link>
              );
            })}
          </motion.div>

          {/* CTA for Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 md:p-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/40 rounded-xl text-center space-y-4"
          >
            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{t('discover')}</h3>
            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base max-w-2xl mx-auto">
              {t('manageFeatures')}
            </p>
            <Link
              to="/dashboard/employee"
              className="inline-block px-6 md:px-8 py-2 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all text-sm md:text-base"
            >
              {t('exploreDashboard')}
            </Link>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}