import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import { Megaphone, Pin, Calendar, User } from 'lucide-react';

export const AnnouncementsScreen: React.FC = () => {
  const announcements = apiService.getAnnouncements();

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 shadow-lg space-y-1">
        <h2 className="text-base font-extrabold text-white">Announcements & Policies</h2>
        <p className="text-xs text-slate-400">
          Official communications from LogiBrisk management and HR
        </p>
      </div>

      <div className="space-y-3">
        {announcements.map((item) => (
          <div
            key={item.id}
            className={`bg-[#121a2f] border rounded-2xl p-4 space-y-2.5 shadow-md ${
              item.pinned ? 'border-amber-500/60 bg-[#162138]' : 'border-[#243456]'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {item.pinned && <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {item.title}
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 shrink-0">
                {item.category}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {item.content}
            </p>

            <div className="pt-2 border-t border-[#243456]/50 flex items-center justify-between text-[11px] text-slate-500">
              <span>By {item.author}</span>
              <span>{item.dateIST}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
