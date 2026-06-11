'use client';

import { useState, useEffect } from 'react';
import { Sun, Thermometer, Clock } from 'lucide-react';

export default function DateTimeWeather() {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return <div className="h-4 w-32" />; // Return empty placeholder during SSR
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Mock weather data
  const weather = {
    temp: 31,
    condition: 'Cerah Berawan',
    icon: <Sun size={14} className="text-yellow-500" />
  };

  return (
    <div className="flex items-center gap-2.5 text-[9px] font-medium tracking-[0.04em] sm:gap-3 sm:text-[10px]">
      {/* Date & Clock */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <span className="hidden lg:inline text-brand-text-muted/80">{formatDate(time)}</span>
        <div className="flex items-center gap-1 text-brand-black font-mono font-semibold tracking-tight dark:text-white">
          <Clock size={10} className="text-brand-red/90 opacity-80 sm:size-[11px]" />
          {formatTime(time)}
        </div>
      </div>

      <div className="h-2.5 w-px bg-gray-200 dark:bg-white/10" />

      {/* Weather */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="flex items-center gap-1">
          {weather.icon}
          <span className="hidden md:inline text-brand-black/90 dark:text-white/90">{weather.condition}</span>
        </div>
        <div className="flex items-center gap-1 text-brand-text-muted/85">
          <Thermometer size={11} />
          <span>{weather.temp}°C</span>
        </div>
        <div className="hidden xl:flex items-center gap-1.5 text-brand-text-muted/75 font-normal lowercase italic tracking-normal">
          <span className="h-1 w-1 rounded-full bg-gray-300" />
          Jakarta, Indonesia
        </div>
      </div>
    </div>
  );
}
