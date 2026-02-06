import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, User, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';

const navItems = [
  { path: '/', icon: Home, label: 'Home', activeIcon: Home },
  { path: '/anime-list', icon: Search, label: 'Cari', activeIcon: Search },
  { path: '/schedule', icon: Calendar, label: 'Jadwal', activeIcon: Clock },
  { path: '/profile', icon: User, label: 'Profile', activeIcon: User },
];

export default function BottomNav() {
  const location = useLocation();
  const { user } = useApp();

  // Don't show on certain pages
  const hideOnPaths = ['/watch', '/login', '/register'];
  if (hideOnPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
      {/* Gradient background for smooth blend */}
      <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-[#0F0F1A] to-transparent pointer-events-none" />
      
      <div className="bg-[#0F0F1A]/98 backdrop-blur-xl border-t border-white/10 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]">
        <div className="flex items-center justify-around">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            // Jadwal redirect to login if not authenticated (optional - schedule can be public)
            const targetPath = item.label === 'Jadwal' && !user 
              ? '/login' 
              : item.path;

            return (
              <Link
                key={item.label}
                to={targetPath}
                className="relative flex flex-col items-center py-1 px-2"
              >
                {/* Active indicator background */}
                {active && (
                  <motion.div
                    layoutId="bottomNavActive"
                    className="absolute inset-0 bg-[#6C5DD3]/15 rounded-2xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                {/* Icon container */}
                <motion.div 
                  className={`relative p-2.5 rounded-xl transition-colors duration-200 ${
                    active 
                      ? 'text-[#6C5DD3]' 
                      : 'text-white/50 hover:text-white/70'
                  }`}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon 
                    className={`w-5 h-5 transition-all duration-200 ${
                      active ? 'stroke-[2.5px]' : 'stroke-[1.5px]'
                    }`} 
                  />
                  
                  {/* Active dot indicator */}
                  {active && (
                    <motion.span 
                      layoutId="bottomNavDot"
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#6C5DD3] rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                    />
                  )}
                </motion.div>
                
                {/* Label */}
                <span className={`text-[10px] font-medium transition-all duration-200 ${
                  active 
                    ? 'text-[#6C5DD3] font-semibold' 
                    : 'text-white/50'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
