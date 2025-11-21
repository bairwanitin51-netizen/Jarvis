
import React, { useState, useEffect } from 'react';
import { TelemetryPanel } from './TelemetryPanel';

const timezones = [
  { city: 'NEW YORK', zone: 'America/New_York' },
  { city: 'LONDON', zone: 'Europe/London' },
  { city: 'TOKYO', zone: 'Asia/Tokyo' },
  { city: 'HONG KONG', zone: 'Asia/Hong_Kong' },
];

const getTimeForZone = (zone: string) => {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: zone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const WorldClockPanel: React.FC = () => {
  const [times, setTimes] = useState(() => 
    timezones.map(tz => ({ ...tz, time: getTimeForZone(tz.zone) }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimes(timezones.map(tz => ({ ...tz, time: getTimeForZone(tz.zone) })));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TelemetryPanel title="GLOBAL CLOCK">
      <div className="space-y-1">
        {times.map(({ city, time }) => (
          <div key={city} className="flex justify-between">
            <span className="text-cyan-300/80">{city}</span>
            <span className="text-cyan-200 font-bold">{time}</span>
          </div>
        ))}
      </div>
    </TelemetryPanel>
  );
};
