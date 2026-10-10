import React, { useState, useEffect } from 'react';

export default function Countdown({ targetDate }) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const timer = setInterval(() => {
            const difference = +new Date(targetDate) - +new Date();
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else {
                clearInterval(timer);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <div className="bg-stone-200 py-16 text-center">
            <h2 className="text-sm uppercase tracking-[0.3em] text-stone-600 mb-8">Faltan</h2>
            <div className="flex justify-center gap-6 md:gap-12 text-3xl md:text-5xl font-bold font-sans">
                {Object.entries(timeLeft).map(([unit, value]) => (
                    <div key={unit} className="flex flex-col items-center">
                        <span className="text-stone-800 w-16 md:w-24">{value}</span>
                        <span className="text-xs font-normal tracking-widest text-stone-500 uppercase mt-4">
                            {unit === 'days' ? 'Días' : unit === 'hours' ? 'Hrs' : unit === 'minutes' ? 'Min' : 'Seg'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
