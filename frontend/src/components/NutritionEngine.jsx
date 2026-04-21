import React, { useState, useEffect } from 'react';
import { DAILY_PROTOCOL } from '../data/dailyProtocol';
import { soundEngine } from '../services/soundEngine';

export default function NutritionEngine() {
    const [protein, setProtein] = useState(0);
    const [tanCheck, setTanCheck] = useState({ am: false, pm: false });
    const [supplements, setSupplements] = useState({
        multivitamin: false,
        fishOil: false,
        vitaminD3: false
    });

    // Get current meal slot static data
    const mealData = DAILY_PROTOCOL.nutrition;

    // Determine active slot for highlighting
    const getActiveSlot = () => {
        const hour = new Date().getHours();
        if (hour < 11) return 'breakfast';
        if (hour < 16) return 'lunch';
        if (hour < 19) return 'snack';
        return 'dinner';
    };
    const activeSlot = getActiveSlot();

    const PROTEIN_TARGET = 120;

    useEffect(() => {
        const savedP = localStorage.getItem('daily_protein');
        const savedT = localStorage.getItem('daily_tan_check');
        const savedS = localStorage.getItem('daily_supplements');

        if (savedP) setProtein(parseInt(savedP));
        if (savedT) setTanCheck(JSON.parse(savedT));
        if (savedS) setSupplements(JSON.parse(savedS));
    }, []);

    const updateProtein = (val) => {
        const newVal = Math.min(PROTEIN_TARGET, Math.max(0, val));
        setProtein(newVal);
        localStorage.setItem('daily_protein', newVal);
        window.dispatchEvent(new Event("ldt:update"));
        soundEngine.playInject();
    };

    const toggleNutrient = (key, val, setFunc, storageKey, obj) => {
        const newVal = { ...obj, [key]: !obj[key] };
        setFunc(newVal);
        localStorage.setItem(storageKey, JSON.stringify(newVal));
        window.dispatchEvent(new Event("ldt:update"));
        soundEngine.playLock();
    };


    const proteinProgress = (protein / PROTEIN_TARGET) * 100;

    return (
        <div className="bg-cyber-gray border border-cyber-accent p-6 rounded-xl shadow-lg space-y-8">

            <div className="flex justify-between items-center">
                <h2 className="text-neon-green font-mono text-xl tracking-wider">FUEL_INJECTOR</h2>
                <div className="text-xs text-cyber-text font-mono border border-neon-green px-2 py-1 rounded text-neon-green">
                    TARGET: 2300KCAL / 120G
                </div>
            </div>

            {/* Meal Protocol Grid */}
            <div className="grid grid-cols-1 gap-2">
                {Object.entries(mealData).map(([slot, data]) => {
                    const isActive = slot === activeSlot;
                    return (
                        <div key={slot} className={`p-3 rounded border transition-all ${isActive ? 'bg-cyber-dark border-neon-cyan shadow-[0_0_10px_rgba(0,243,255,0.1)]' : 'bg-transparent border-cyber-accent opacity-60 hover:opacity-100'}`}>
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-neon-cyan' : 'text-gray-500'}`}>{slot} // {data.macros}</span>
                                <span className="text-xs text-white font-mono">{data.protein}g P</span>
                            </div>
                            <div className="text-sm font-medium text-white mb-1">{data.name}</div>
                            <div className="text-xs text-gray-400">{data.items.join(' + ')}</div>
                        </div>
                    );
                })}
            </div>

            {/* Protein Tracker */}
            <div>
                <div className="flex justify-between text-sm text-cyber-text mb-2 font-mono">
                    <span>PROTEIN INTAKE</span>
                    <span>{protein} / {PROTEIN_TARGET}g</span>
                </div>
                <div className="h-4 bg-cyber-dark rounded-full overflow-hidden border border-cyber-accent relative cursor-pointer" onClick={() => updateProtein(protein + 5)}>
                    <div
                        className="h-full bg-gradient-to-r from-neon-green to-emerald-600 transition-all duration-500 relative"
                        style={{ width: `${proteinProgress}%` }}
                    ></div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => updateProtein(protein + 26)} className="text-[10px] border border-gray-600 px-2 py-1 rounded hover:bg-white hover:text-black">+26g (Bfast)</button>
                    <button onClick={() => updateProtein(protein + 40)} className="text-[10px] border border-gray-600 px-2 py-1 rounded hover:bg-white hover:text-black">+40g (Lunch)</button>
                    <button onClick={() => updateProtein(protein + 25)} className="text-[10px] border border-gray-600 px-2 py-1 rounded hover:bg-white hover:text-black">+25g (Snack)</button>
                    <button onClick={() => updateProtein(protein + 30)} className="text-[10px] border border-gray-600 px-2 py-1 rounded hover:bg-white hover:text-black">+30g (Dinner)</button>
                    <button onClick={() => updateProtein(0)} className="text-[10px] border border-red-900 text-red-500 px-2 py-1 rounded hover:bg-red-500 hover:text-black">CLR</button>
                </div>
            </div>

            {/* Tan Check & Supplements */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-cyber-accent">
                {/* Tan Check */}
                <div>
                    <div className="text-[10px] text-neon-pink uppercase tracking-widest mb-2 font-bold">☀️ TAN_DEFENSE</div>
                    <div
                        onClick={() => toggleNutrient('am', !tanCheck.am, setTanCheck, 'daily_tan_check', tanCheck)}
                        className={`flex items-center gap-2 text-xs mb-2 cursor-pointer ${tanCheck.am ? 'text-neon-pink decoration-slice' : 'text-gray-500'}`}
                    >
                        <div className={`w-3 h-3 border ${tanCheck.am ? 'bg-neon-pink border-neon-pink' : 'border-gray-500'}`}></div>
                        06:45 AM SPF
                    </div>
                    <div
                        onClick={() => toggleNutrient('pm', !tanCheck.pm, setTanCheck, 'daily_tan_check', tanCheck)}
                        className={`flex items-center gap-2 text-xs cursor-pointer ${tanCheck.pm ? 'text-neon-pink' : 'text-gray-500'}`}
                    >
                        <div className={`w-3 h-3 border ${tanCheck.pm ? 'bg-neon-pink border-neon-pink' : 'border-gray-500'}`}></div>
                        05:45 PM SPF
                    </div>
                </div>

                {/* Stack */}
                <div>
                    <div className="text-[10px] text-neon-cyan uppercase tracking-widest mb-2 font-bold">💊 CHEM_STACK</div>
                    {Object.entries(supplements).map(([key, active]) => (
                        <div
                            key={key}
                            onClick={() => toggleNutrient(key, !active, setSupplements, 'daily_supplements', supplements)}
                            className={`flex items-center gap-2 text-xs mb-2 cursor-pointer ${active ? 'text-neon-cyan' : 'text-gray-500'}`}
                        >
                            <div className={`w-3 h-3 rounded-full ${active ? 'bg-neon-cyan shadow-[0_0_5px_#00f3ff]' : 'bg-gray-700'}`}></div>
                            {key.replace(/([A-Z])/g, '')}
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
