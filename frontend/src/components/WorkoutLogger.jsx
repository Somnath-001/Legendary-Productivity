import React, { useState, useEffect } from 'react';
import { DAILY_PROTOCOL } from '../data/dailyProtocol';
import { soundEngine } from '../services/soundEngine';

export default function WorkoutLogger() {
    const [sessionActive, setSessionActive] = useState(false);
    const [duration, setDuration] = useState(0);
    const [finisher, setFinisher] = useState(null);

    // Get Today's Mission
    const dayIndex = new Date().getDay();
    const mission = DAILY_PROTOCOL.workouts[dayIndex];

    // Timer
    useEffect(() => {
        let interval;
        if (sessionActive) {
            interval = setInterval(() => setDuration(d => d + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [sessionActive]);

    const generateFinisher = () => {
        const random = DAILY_PROTOCOL.finishers[Math.floor(Math.random() * DAILY_PROTOCOL.finishers.length)];
        setFinisher(random);
    };

    const formatTime = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-cyber-gray border border-cyber-accent p-6 rounded-xl shadow-lg relative overflow-hidden">

            {/* Header with Active Pulse */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="text-xs text-cyber-text uppercase tracking-widest mb-1">DAILY_MISSION // {mission.type}</div>
                    <h2 className="text-neon-cyan font-mono text-xl tracking-wider font-bold">{mission.focus.toUpperCase()}</h2>
                </div>
                <div className={`font-mono text-2xl font-bold ${sessionActive ? 'text-neon-green animate-pulse' : 'text-gray-600'}`}>
                    {formatTime(duration)}
                </div>
            </div>

            {/* Exercise List */}
            <div className="space-y-3 mb-6">
                {mission.moves.map((move, i) => (
                    <div key={i} className="flex items-center gap-3 bg-cyber-dark p-3 rounded border border-cyber-accent">
                        <div className="text-neon-cyan font-mono text-sm opacity-50">0{i + 1}</div>
                        <div className="text-white font-medium">{move}</div>
                        <input type="checkbox" className="ml-auto w-5 h-5 accent-neon-cyan" onChange={() => soundEngine.playLock()} />
                    </div>
                ))}
            </div>

            {/* Finisher Section */}
            <div className="mb-6 border-t border-dashed border-gray-700 pt-4">
                {!finisher ? (
                    <button
                        onClick={generateFinisher}
                        className="w-full py-2 text-sm border border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-black transition uppercase tracking-widest font-bold"
                    >
                        🎲 GEnerate_CHAOS_PROTOCOL
                    </button>
                ) : (
                    <div className="bg-neon-pink/10 border border-neon-pink p-3 rounded text-center animate-pulse">
                        <div className="text-xs text-neon-pink uppercase font-bold mb-1">⚠️ FINISHER ACTIVATED</div>
                        <div className="text-white font-bold text-lg">{finisher}</div>
                    </div>
                )}
            </div>

            {/* Session Controls */}
            <button
                onClick={() => {
                    const active = !sessionActive;
                    setSessionActive(active);
                    if (sessionActive && duration > 60) {
                        const log = JSON.parse(localStorage.getItem('ldt:workouts_log') || '[]');
                        log.push({ date: new Date().toISOString(), duration, type: mission.type });
                        localStorage.setItem('ldt:workouts_log', JSON.stringify(log));
                        window.dispatchEvent(new Event("ldt:update"));
                        soundEngine.playMissionComplete();
                    }
                }}
                className={`w-full py-3 rounded font-bold tracking-wider transition ${sessionActive
                    ? 'bg-red-500/20 text-red-500 border border-red-500 hover:bg-red-500 hover:text-black'
                    : 'bg-neon-cyan text-black hover:bg-cyan-400 border border-neon-cyan'
                    }`}
            >
                {sessionActive ? 'TERMINATE_SESSION' : 'INITIATE_PROTOCOL'}
            </button>
        </div>
    );
}
