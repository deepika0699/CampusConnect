import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  date: string; // Format: YYYY-MM-DD
  time: string; // Format: HH:MM or 12-hour format
  onComplete?: () => void;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  date, 
  time, 
  onComplete, 
  className = '' 
}) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (!date) return;

    // Parse target date-time
    let hh = 10; // default to 10:00 AM if unparsable
    let mm = 0;
    
    const cleanedTime = (time || '').trim();
    // Match 12-hour format (e.g. "10:00 AM", "02:30 PM")
    const ampmMatch = cleanedTime.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (ampmMatch) {
      hh = parseInt(ampmMatch[1], 10);
      mm = parseInt(ampmMatch[2], 10);
      const ampm = ampmMatch[3].toUpperCase();
      if (ampm === 'PM' && hh < 12) hh += 12;
      if (ampm === 'AM' && hh === 12) hh = 0;
    } else {
      // Match 24-hour format (e.g. "14:00")
      const timeParts = cleanedTime.split(':');
      hh = parseInt(timeParts[0], 10) || 10;
      mm = parseInt(timeParts[1], 10) || 0;
    }

    const [year, month, day] = date.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day, hh, mm);

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft(null);
        setIsStarted(true);
        if (onComplete) onComplete();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
      setIsStarted(false);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [date, time, onComplete]);

  if (isStarted) {
    return (
      <span className={`inline-flex items-center text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md ${className}`}>
        Event Started
      </span>
    );
  }

  if (!timeLeft) return null;

  const { days, hours, minutes, seconds } = timeLeft;

  return (
    <div className={`flex items-center gap-1 text-[10px] font-bold ${className}`} id="countdown-timer">
      <span className="text-slate-400 uppercase tracking-wider text-[9px]">Starts in:</span>
      <div className="flex gap-0.5 font-mono text-indigo-600 bg-indigo-50/60 border border-indigo-100/40 px-2 py-0.5 rounded-md text-[10px] tracking-tight">
        {days > 0 && <span>{days}d </span>}
        <span>{hours.toString().padStart(2, '0')}h </span>
        <span>{minutes.toString().padStart(2, '0')}m </span>
        <span className="text-indigo-400 font-medium">{seconds.toString().padStart(2, '0')}s</span>
      </div>
    </div>
  );
};
