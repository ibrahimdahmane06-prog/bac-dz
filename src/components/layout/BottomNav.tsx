import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, BookOpen, User, CreditCard, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export const BottomNav: React.FC = () => {
  const items = [
    { icon: <Home size={22} />, label: "الرئيسية", path: "/" },
    { icon: <BookOpen size={22} />, label: "المواد", path: "/subjects" },
    { icon: <Users size={22} />, label: "المنتدى", path: "/forum" },
    { icon: <MessageSquare size={22} />, label: "المساعد", path: "/assistant" },
    { icon: <CreditCard size={22} />, label: "الاشتراك", path: "/payment" },
    { icon: <User size={22} />, label: "حسابي", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 flex justify-between items-center z-50">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                {item.icon}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 left-0 right-0 h-1 bg-emerald-500 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};
