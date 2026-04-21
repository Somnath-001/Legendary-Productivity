import React, { useEffect, useState } from "react";

function getLocalJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function getLocalInt(key, fallback) {
  const val = localStorage.getItem(key);
  return val ? parseInt(val, 10) : fallback;
}

function formatDateYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const TrendChart = ({ title, data, color, maxVal }) => {
  // data: [{label: 'Mon', value: 10}, ...]
  const height = 100;
  const width = 300;
  const barWidth = 20;
  const gap = 20;

  // Auto-scale max if not provided
  const calculatedMax = maxVal || Math.max(...data.map(d => d.value), 10);

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{title}</h4>
      <div className="flex justify-center">
        <svg width="100%" height={height + 20} viewBox={`0 0 ${width} ${height + 20}`} className="overflow-visible">
          {/* Bars */}
          {data.map((d, i) => {
            const barH = (d.value / calculatedMax) * height;
            const x = i * (barWidth + gap) + 10;
            const y = height - barH;

            return (
              <g key={i}>
                <rect x={x} y={y} width={barWidth} height={barH} rx="4" fill={color} opacity="0.8" />
                <text x={x + barWidth / 2} y={height + 15} textAnchor="middle" fontSize="10" fill="#94a3b8">{d.label}</text>
                {d.value > 0 && <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569">{d.value}</text>}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const getRank = (streak) => {
  if (streak >= 90) return { title: "ELITE OPERATOR", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500" };
  if (streak >= 30) return { title: "CYBER NINJA", color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400" };
  if (streak >= 7) return { title: "HACKTIVIST", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400" };
  return { title: "SCRIPT KIDDIE", color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400" };
};

export default function Analytics() {
  const [stats, setStats] = useState(null);

  const computeStats = () => {
    // 1. Physical Metrics
    const protein = getLocalInt("daily_protein", 0);
    const workoutsLog = getLocalJson("ldt:workouts_log", []);
    const todayYMD = formatDateYmd(new Date());
    const workoutDone = workoutsLog.some(w => w.date.startsWith(todayYMD));

    // 2. Cognitive Metrics
    const deepwork = getLocalJson("ldt:deepwork", []);
    const todayDeepWork = deepwork
      .filter(s => formatDateYmd(new Date(s.ts)) === todayYMD)
      .reduce((acc, curr) => acc + (curr.minutes || 0), 0);

    const tasks = getLocalJson("ldt:tasks", []);
    const tasksDoneToday = tasks.filter(t => t.done).length;

    // 3. Discipline Metrics
    const habits = getLocalJson("ldt:habits", []);
    let habitsDoneCount = 0;
    let habitTotal = habits.length;
    const currentDayIndex = (new Date().getDay() + 6) % 7;
    if (habitTotal > 0) {
      habitsDoneCount = habits.filter(h => h.completedDays && h.completedDays.includes(currentDayIndex)).length;
    }
    const integrityStreak = getLocalInt("integrity_streak", 0);

    // Score Calculation
    const proteinScore = Math.min(protein / 120, 1) * 20;
    const workoutScore = workoutDone ? 20 : 0;
    const deepWorkScore = Math.min(todayDeepWork / 120, 1) * 20;
    const habitScore = habitTotal > 0 ? (habitsDoneCount / habitTotal) * 20 : 0;
    const integrityScore = integrityStreak > 0 ? 20 : 0;
    const dailyScore = Math.round(proteinScore + workoutScore + deepWorkScore + habitScore + integrityScore);

    // Rank Calculation
    const rank = getRank(integrityStreak);

    // --- Trend Data Generation (Last 7 Days) ---
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push({
        ymd: formatDateYmd(d),
        label: d.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }

    // Deep Work Trend
    const dwTrend = last7Days.map(day => {
      const mins = deepwork
        .filter(s => formatDateYmd(new Date(s.ts)) === day.ymd)
        .reduce((acc, c) => acc + (c.minutes || 0), 0);
      return { label: day.label, value: mins };
    });

    // Habits Trend
    const habitTrend = last7Days.map(day => {
      const count = habits.reduce((acc, h) => {
        const history = Array.isArray(h.history) ? h.history : [];
        return acc + (history.includes(day.ymd) ? 1 : 0);
      }, 0);
      return { label: day.label, value: count };
    });


    setStats({
      protein,
      workoutDone,
      todayDeepWork,
      tasksDoneToday,
      habitsDoneCount,
      habitTotal,
      integrityStreak,
      dailyScore,
      rank,
      lastUpdated: new Date(),
      dwTrend,
      habitTrend
    });
  };

  useEffect(() => {
    computeStats();
    const onUpdate = () => computeStats();

    window.addEventListener("storage", onUpdate);
    window.addEventListener("ldt:update", onUpdate);
    const interval = setInterval(onUpdate, 5000);

    return () => {
      window.removeEventListener("storage", onUpdate);
      window.removeEventListener("ldt:update", onUpdate);
      clearInterval(interval);
    };
  }, []);

  if (!stats) return <div className="p-6">Loading Analytics...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow space-y-6">
      {/* Header with Rank Badge */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-slate-800">Commander's Overview</h2>
            <span className={`px-3 py-1 rounded text-xs font-bold border tracking-widest ${stats.rank.bg} ${stats.rank.color} ${stats.rank.border}`}>
              {stats.rank.title} // Lvl.{Math.floor(stats.integrityStreak / 7)}
            </span>
          </div>
          <p className="text-slate-500 text-sm">Real-time Life Operating System Status</p>
        </div>
        <div className="text-right flex items-center gap-4">
          <div>
            <div className="text-3xl font-bold text-slate-700">{stats.integrityStreak}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Streak Days</div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <div className="text-5xl font-bold text-indigo-600">{stats.dailyScore}%</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Perf.</div>
          </div>
        </div>
      </div>

      {/* SQUADS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* PHYSICAL SQUAD */}
        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">💪 Physical Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Protein Intake</span>
              <span className="font-mono font-bold text-emerald-600">{stats.protein}/120g</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${(stats.protein / 120) * 100}%` }}></div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-600">Workout Mission</span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${stats.workoutDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                {stats.workoutDone ? 'COMPLETE' : 'PENDING'}
              </span>
            </div>
          </div>
        </div>

        {/* COGNITIVE SQUAD */}
        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">🧠 Cognitive Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Deep Work Today</span>
              <span className="font-mono font-bold text-indigo-600">{stats.todayDeepWork}m</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full" style={{ width: `${(stats.todayDeepWork / 120) * 100}%` }}></div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-600">Tasks Completed</span>
              <span className="font-mono font-bold text-slate-800">{stats.tasksDoneToday}</span>
            </div>
          </div>
        </div>

        {/* DISCIPLINE SQUAD */}
        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">🛡️ Discipline Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Integrity Streak</span>
              <span className="font-mono font-bold text-amber-600">{stats.integrityStreak} Days</span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-600">Habits Today</span>
              <span className="font-mono font-bold text-slate-800">{stats.habitsDoneCount}/{stats.habitTotal}</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full" style={{ width: `${stats.habitTotal ? (stats.habitsDoneCount / stats.habitTotal) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>

      </div>

      {/* TREND GRAPHS */}
      <h3 className="text-lg font-bold text-slate-700 pt-4">Data streams (7 Days)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TrendChart title="Cognitive Output (Minutes)" data={stats.dwTrend} color="#6366f1" />
        <TrendChart title="Discipline Consistency (Habits)" data={stats.habitTrend} color="#f59e0b" maxVal={stats.habitTotal} />
      </div>

      <div className="text-center text-xs text-slate-300 mt-4">
        System Status: ONLINE // Last Sync: {stats.lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
}
