import React from 'react';
import SystemIntegrity from './SystemIntegrity';
import WorkoutLogger from './WorkoutLogger';
import DeepWork from './DeepWork';
import NutritionEngine from './NutritionEngine';

export default function HybridDashboard() {
    return (
        <div className="min-h-screen bg-cyber-black text-cyber-text p-6 font-sans">
            <header className="mb-8 border-b border-cyber-accent pb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tighter">
                        OPERATOR_<span className="text-neon-green">DASHBOARD</span>
                    </h1>
                    <p className="text-cyber-text text-sm font-mono mt-1 opacity-60">Status: ONLINE // Protocol: HYBRID_ATHLETE</p>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-neon-cyan font-mono text-xl">{new Date().toLocaleTimeString()}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest">{new Date().toLocaleDateString()}</div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {/* Row 1: High Priority Integrity */}
                <div className="lg:col-span-2 xl:col-span-1">
                    <SystemIntegrity />
                </div>

                {/* Row 1: Deep Work - Critical */}
                <div className="lg:col-span-2 xl:col-span-1">
                    <DeepWork />
                </div>

                {/* Vertical Stack: Physical & Recovery */}
                <div className="lg:col-span-2 xl:col-span-1 space-y-6">
                    <WorkoutLogger />
                    <NutritionEngine />
                </div>
            </div>
        </div>
    );
}
