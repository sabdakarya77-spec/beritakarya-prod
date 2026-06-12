'use client';

import { Activity } from 'lucide-react';

interface AuditLogsWidgetProps {
  logs: any[];
  site: string;
}

export function AuditLogsWidget({ logs, site }: AuditLogsWidgetProps) {
  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-brand-red" />
          <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">
            Log Aktivitas Sistem Terkini
          </h3>
        </div>
      </div>
      <div className="p-6 divide-y divide-gray-50 dark:divide-white/5">
        {logs.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">Tidak ada log aktivitas.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-brand-black dark:text-white">
                  <span className="font-black uppercase tracking-wider text-[10px] text-brand-red mr-1.5">{log.action}</span>
                  {log.user?.name || log.userId}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Entity: {log.entityType || '-'} ({log.entityId || '-'})</p>
              </div>
              <span className="text-[9px] font-bold text-gray-400 tabular-nums">
                {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
