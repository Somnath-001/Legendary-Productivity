import React, { useState, useEffect } from 'react';
import { soundEngine } from '../services/soundEngine';

export default function SystemIntegrity() {
    const [streak, setStreak] = useState(() => {
        const saved = localStorage.getItem('integrity_streak');
        return saved ? parseInt(saved, 10) : 0;
    });

    const [lastRelapse, setLastRelapse] = useState(() => {
        return localStorage.getItem('integrity_last_relapse') || null;
    });

    const [panicMode, setPanicMode] = useState(false);
    const [timer, setTimer] = useState(120); // 2 minutes
    const [isBreached, setIsBreached] = useState(false);

    useEffect(() => {
        localStorage.setItem('integrity_streak', streak);
        if (lastRelapse) localStorage.setItem('integrity_last_relapse', lastRelapse);
        window.dispatchEvent(new Event("ldt:update"));
    }, [streak, lastRelapse]);

    // Panic Timer Logic
    useEffect(() => {
        let interval = null;
        if (panicMode && timer > 0) {
            interval = setInterval(() => setTimer((t) => t - 1), 1000);
        } else if (timer === 0) {
            setPanicMode(false);
            setTimer(120);
        }
        return () => clearInterval(interval);
    }, [panicMode, timer]);

    const handleRelapse = () => {
        if (confirm("Reset integrity streak? This will trigger a SYSTEM FAILURE event.")) {
            setStreak(0);
            setLastRelapse(new Date().toISOString());
            triggerGlitch();
        }
    };

    const triggerGlitch = () => {
        setIsBreached(true);
        soundEngine.playGlitch();
        setTimeout(() => setIsBreached(false), 2000); // 2 second glitch
    };

    const engagePanic = () => {
        setPanicMode(true);
        soundEngine.playPanic();
    };

    return (
        <div className={`bg-cyber-gray border border-cyber-accent p-6 rounded-xl shadow-lg relative overflow-hidden transition-all duration-100 ${isBreached ? 'animate-pulse bg-red-900 border-red-500 scale-[1.02]' : ''}`}>

            {/* Glitch Overlay */}
            {isBreached && (
                <div className="absolute inset-0 bg-black/80 z-40 flex items-center justify-center pointer-events-none">
                    <h1 className="text-6xl text-red-600 font-mono font-bold tracking-[0.5em] animate-bounce">SYSTEM_FAILURE</h1>
                </div>
            )}

            {/* Panic Overlay */}
            {panicMode && (
                <div className="absolute inset-0 bg-neon-red bg-opacity-95 z-50 flex flex-col items-center justify-center animate-pulse text-cyber-black font-bold">
                    <h1 className="text-6xl mb-4">PHYSICAL OVERRIDE</h1>
                    <p className="text-2xl mb-8">DO 30 AIR SQUATS NOW</p>
                    <div className="text-9xl font-mono">
                        {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                    </div>
                    <button
                        onClick={() => setPanicMode(false)}
                        className="mt-8 px-8 py-4 bg-cyber-black text-neon-red text-xl rounded border-2 border-cyber-black hover:bg-transparent hover:text-white transition"
                    >
                        DISENGAGE
                    </button>
                </div>
            )}

            {/* Standard View */}
            <h2 className="text-neon-green font-mono text-xl mb-4 tracking-wider flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isBreached ? 'bg-red-500' : 'bg-neon-green animate-pulse'}`}></span>
                {isBreached ? 'INTEGRITY_COMPROMISED' : 'SYSTEM_INTEGRITY'}
            </h2>

            <div className="flex justify-between items-end mb-6">
                <div>
                    <p className="text-cyber-text text-sm uppercase tracking-widest opacity-70">Integrity Streak</p>
                    <div className={`text-6xl font-mono font-bold ${isBreached ? 'text-red-500' : 'text-white'}`}>{streak} <span className="text-base text-neon-green">DAYS</span></div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <button
                        onClick={() => setStreak(s => s + 1)}
                        className="px-3 py-1 text-xs border border-neon-green text-neon-green hover:bg-neon-green hover:text-cyber-black transition"
                    >
                        + ADD DAY
                    </button>
                    <button
                        onClick={handleRelapse}
                        className="text-xs text-red-500 hover:text-red-400 underline"
                    >
                        REPORT_BREACH
                    </button>
                </div>
            </div>

            <button
                onClick={engagePanic}
                className="w-full py-4 bg-transparent border-2 border-neon-red text-neon-red font-bold text-xl tracking-[0.2em] hover:bg-neon-red hover:text-black transition-all duration-300 shadow-[0_0_15px_rgba(255,42,42,0.3)] hover:shadow-[0_0_30px_rgba(255,42,42,0.6)]"
            >
                ⚠️ INITIATE_PANIC_PROTOCOL
            </button>
        </div>
    );
}
