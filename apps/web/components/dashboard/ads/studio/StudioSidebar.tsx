'use client';

import { Package, FileText, Upload, CreditCard, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { useStudio } from './StudioContext';
import type { SectionId } from './types';

const steps: { id: SectionId; label: string; icon: typeof Package }[] = [
  { id: 'package', label: 'Pilih Paket', icon: Package },
  { id: 'campaign', label: 'Detail Iklan', icon: FileText },
  { id: 'creative', label: 'Upload Materi', icon: Upload },
  { id: 'payment', label: 'Pembayaran', icon: CreditCard },
];

export function StudioSidebar() {
  const { activeStep, setActiveStep, data } = useStudio();

  const isComplete = (id: SectionId) => {
    switch (id) {
      case 'package': return !!data.selectedPackage;
      case 'campaign': return !!data.campaignName && !!data.linkUrl;
      case 'creative': return !!data.adFile;
      case 'payment': return !!data.receiptFile;
    }
  };

  return (
    <div className="space-y-0.5">
      <p className="px-3 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">
        Langkah Pemesanan
      </p>
      {steps.map((step) => {
        const active = activeStep === step.id;
        const complete = isComplete(step.id);
        const Icon = complete ? CheckCircle2 : step.icon;

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => setActiveStep(step.id)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden w-full text-left",
              active
                ? 'bg-brand-red text-white shadow-lg shadow-brand-red/30'
                : complete
                  ? 'text-emerald-400 hover:bg-white/5 hover:text-emerald-300'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
            )}
          >
            {active && (
              <div className="absolute inset-0 bg-gradient-to-r from-brand-red via-red-500 to-brand-red opacity-50 animate-pulse" />
            )}
            <Icon size={17} strokeWidth={active ? 2.5 : 1.8} className="relative z-10 flex-shrink-0" />
            <span className="text-[11px] font-black uppercase tracking-wider relative z-10">{step.label}</span>
            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white relative z-10" />}
          </button>
        );
      })}
    </div>
  );
}
