import React from 'react';
import { motion } from 'framer-motion';

export const ConceptDiagram: React.FC = () => {
  return (
    <div className="my-8 p-6 bg-emerald-50 rounded-[32px] border border-emerald-100 relative overflow-hidden">
      <h4 className="text-center font-bold text-emerald-800 mb-8 text-sm">مخطط تفاعلي: العلاقة بين الفكر والمادة</h4>
      
      <div className="relative flex justify-between items-center max-w-xs mx-auto">
        {/* Concept 1: Idea */}
        <motion.div 
          whileHover={{ scale: 1.1 }}
          className="w-20 h-20 bg-white rounded-2xl shadow-lg shadow-emerald-100 flex flex-col items-center justify-center p-2 z-10 border border-emerald-200"
        >
          <div className="text-2xl mb-1">💡</div>
          <span className="text-[10px] font-bold text-gray-800">الفكرة (المثالية)</span>
        </motion.div>

        {/* Connection Arrow */}
        <div className="flex-1 px-2 relative h-px bg-emerald-300">
           <motion.div 
             animate={{ x: [0, 50, 0] }}
             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
             className="absolute -top-1.5 left-0 w-3 h-3 bg-emerald-500 rounded-full blur-[2px]"
           />
           <div className="absolute -top-1 left-full -translate-x-1 border-4 border-transparent border-r-emerald-300"></div>
           <div className="absolute -top-1 right-full translate-x-1 border-4 border-transparent border-l-emerald-300"></div>
        </div>

        {/* Concept 2: Matter */}
        <motion.div 
          whileHover={{ scale: 1.1 }}
          className="w-20 h-20 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200 flex flex-col items-center justify-center p-2 z-10 border border-emerald-700"
        >
          <div className="text-2xl mb-1 text-white">🪨</div>
          <span className="text-[10px] font-bold text-white">المادة (المادية)</span>
        </motion.div>
      </div>

      <div className="mt-8 text-[11px] text-emerald-700 text-center leading-tight opacity-80">
        اضغط على العناصر لاكتشاف تأثير كل منهما على الآخر في الفلسفة الكلاسيكية.
      </div>
    </div>
  );
};
