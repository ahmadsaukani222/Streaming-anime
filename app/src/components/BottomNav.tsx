// BottomNav - Floating mobile navigation
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';


const navItems = [
  { path: '/', icon: Home, label: 'Home', isSearch: false },
  { path: '/anime-list', icon: Search, label: 'Cari', isSearch: true },
  { path: '/schedule', icon: Calendar, label: 'Jadwal', isSearch: false },
  { path: '/profile', icon: User, label: 'Profile', isSearch: false },
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

  // Handle search button click - trigger global search
  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('openGlobalSearch'));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden pointer-events-none flex justify-center">
      {/* Floating container - centered with max width */}
      <div className="mx-auto mb-5 px-4 w-full max-w-sm pointer-events-auto">
        <motion.div 
          className="relative bg-[#16162a]/98 backdrop-blur-2xl rounded-[28px] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(108,93,211,0.15)] px-3 py-2.5 overflow-hidden"
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.25, duration: 0.7 }}
        >
          {/* Animated background glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#6C5DD3]/10 via-transparent to-[#00C2FF]/10 rounded-[28px]"
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          <div className="relative flex items-center justify-between">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              // For search button
              if (item.isSearch) {
                return (
                  <button
                    key={item.label}
                    onClick={handleSearchClick}
                    className="group relative flex flex-col items-center justify-center min-w-[60px] py-1.5"
                  >
                    {/* Active indicator dot */}
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute -top-1 w-1.5 h-1.5 bg-[#6C5DD3] rounded-full"
                        transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
                      />
                    )}
                    
                    {/* Icon with glow effect when active */}
                    <motion.div 
                      className={`relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ${
                        active 
                          ? 'bg-gradient-to-br from-[#6C5DD3] to-[#5a4ec0] text-white shadow-lg shadow-[#6C5DD3]/30' 
                          : 'text-white/40 group-hover:text-white/70 group-hover:bg-white/5'
                      }`}
                      whileTap={{ scale: 0.88 }}
                      whileHover={!active ? { scale: 1.05 } : {}}
                    >
                      <Icon 
                        className={`w-5 h-5 transition-all duration-200 ${
                          active ? 'stroke-[2.5px]' : 'stroke-[1.5px]'
                        }`} 
                      />
                      
                      {/* Shine effect on active */}
                      {active && (
                        <motion.div
                          className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/20 to-transparent"
                          initial={{ x: '-100%', opacity: 0 }}
                          animate={{ x: '100%', opacity: [0, 0.5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                        />
                      )}
                    </motion.div>
                    
                    {/* Label */}
                    <span className={`text-[11px] font-medium transition-all duration-200 mt-1 ${
                      active 
                        ? 'text-[#6C5DD3] font-semibold' 
                        : 'text-white/40 group-hover:text-white/60'
                    }`}>
                      {item.label}
                    </span>
                  </button>
                );
              }
              
              const targetPath = item.label === 'Jadwal' && !user 
                ? '/login' 
                : item.path;

              return (
                <Link
                  key={item.label}
                  to={targetPath}
                  className="group relative flex flex-col items-center justify-center min-w-[60px] py-1.5"
                >
                  {/* Active indicator dot */}
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -top-1 w-1.5 h-1.5 bg-[#6C5DD3] rounded-full"
                      transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
                    />
                  )}
                  
                  {/* Icon with gradient background when active */}
                  <motion.div 
                    className={`relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ${
                      active 
                        ? 'bg-gradient-to-br from-[#6C5DD3] to-[#5a4ec0] text-white shadow-lg shadow-[#6C5DD3]/30' 
                        : 'text-white/40 group-hover:text-white/70 group-hover:bg-white/5'
                    }`}
                    whileTap={{ scale: 0.88 }}
                    whileHover={!active ? { scale: 1.05 } : {}}
                  >
                    <Icon 
                      className={`w-5 h-5 transition-all duration-200 ${
                        active ? 'stroke-[2.5px]' : 'stroke-[1.5px]'
                      }`} 
                    />
                    
                    {/* Shine effect on active */}
                    {active && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/20 to-transparent"
                        initial={{ x: '-100%', opacity: 0 }}
                        animate={{ x: '100%', opacity: [0, 0.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                      />
                    )}
                  </motion.div>
                  
                  {/* Label */}
                  <span className={`text-[11px] font-medium transition-all duration-200 mt-1 ${
                    active 
                      ? 'text-[#6C5DD3] font-semibold' 
                      : 'text-white/40 group-hover:text-white/60'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.div>
        
        {/* Safe area padding */}
        <div className="h-[env(safe-area-inset-bottom,8px)]" />
      </div>
    </nav>
  );
}
