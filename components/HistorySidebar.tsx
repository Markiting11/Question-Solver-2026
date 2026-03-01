
import React from 'react';
import { HistoryItem, Language } from '../types';
import { Clock, ChevronRight, Bookmark } from 'lucide-react';

interface HistorySidebarProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, onSelect, isOpen, onClose, language }) => {
  
  // Helper to safely get subject text whether it's string (old) or bilingual object (new)
  const getSubject = (item: HistoryItem) => {
    const subj = item.solution.subject as any;
    if (typeof subj === 'string') return subj;
    return subj[language] || subj['en'];
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-72 bg-white/95 backdrop-blur-md shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        border-r border-slate-100 flex flex-col
      `}>
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-violet-600">
          <h2 className="text-lg font-bold text-white flex items-center">
            <Clock className="mr-2" size={20} /> History
          </h2>
          <button onClick={onClose} className="md:hidden text-white/80 hover:text-white bg-white/10 p-1 rounded-md">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {history.length === 0 ? (
            <div className="text-center text-slate-400 mt-10 p-4 flex flex-col items-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                 <Clock size={24} className="opacity-50" />
              </div>
              <p className="font-medium">No questions yet</p>
              <p className="text-sm mt-1 opacity-70">Your solved questions will appear here.</p>
            </div>
          ) : (
            history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className="w-full text-left p-3.5 rounded-xl hover:bg-indigo-50 group border border-transparent hover:border-indigo-100 transition-all duration-200 relative overflow-hidden"
                >
                  <p className="font-medium text-slate-700 group-hover:text-indigo-700 line-clamp-2 text-sm leading-snug pr-2">
                    {item.question}
                  </p>
                  <div className="flex justify-between items-center mt-2.5">
                     <span className="text-xs text-slate-400 font-medium">
                        {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                     </span>
                     <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        {getSubject(item)}
                     </span>
                  </div>
                  {/* Subtle hover strip */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>
                </button>
              ))
          )}
        </div>
        
        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-xs text-center text-slate-400">
           Stored locally on device
        </div>
      </div>
    </>
  );
};
