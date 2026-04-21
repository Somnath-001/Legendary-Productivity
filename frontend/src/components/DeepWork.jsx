import React, { useState } from 'react';

export default function DeepWork() {
    const [target, setTarget] = useState('');
    const [moduleDone, setModuleDone] = useState(false);
    const [timerActive, setTimerActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(4 * 60 * 60); // 4 hours in seconds

    React.useEffect(() => {
        let interval;
        if (timerActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive, timeLeft]);

    const formatTime = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="bg-cyber-gray border border-cyber-accent p-6 rounded-xl shadow-lg">
            <h2 className="text-neon-pink font-mono text-xl mb-4 tracking-wider">CYBER_FOCUS</h2>

            <div className="mb-6">
                <label className="text-xs text-cyber-text uppercase block mb-2">Target / Lab Name</label>
                <input
                    type="text"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="e.g. HackTheBox: Dante"
                    className="w-full bg-cyber-dark border border-cyber-accent rounded p-3 text-white focus:border-neon-pink focus:outline-none font-mono"
                />
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 bg-cyber-dark p-4 rounded border border-cyber-accent text-center">
                    <div className="text-xs text-gray-500 mb-1">SESSION TIMER</div>
                    <div className="text-3xl font-mono text-white">{formatTime(timeLeft)}</div>
                    <button
                        onClick={() => setTimerActive(!timerActive)}
                        className="text-xs text-neon-pink mt-2 hover:underline"
                    >
                        {timerActive ? 'PAUSE' : 'START'}
                    </button>
                </div>

                <div
                    onClick={() => setModuleDone(!moduleDone)}
                    className={`cursor-pointer flex-1 p-4 rounded border border-cyber-accent flex flex-col items-center justify-center transition-all ${moduleDone ? 'bg-neon-green/10 border-neon-green' : 'bg-cyber-dark'
                        }`}
                >
                    <div className={`w-6 h-6 rounded-sm border mb-2 flex items-center justify-center ${moduleDone ? 'bg-neon-green border-neon-green' : 'border-gray-500'
                        }`}>
                        {moduleDone && <span className="text-black font-bold">✓</span>}
                    </div>
                    <span className={`text-xs font-bold ${moduleDone ? 'text-neon-green' : 'text-gray-500'}`}>
                        MBA MODULE
                    </span>
                </div>
            </div>
        </div>
    );
}
