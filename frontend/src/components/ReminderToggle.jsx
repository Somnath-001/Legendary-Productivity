import React, { useMemo } from "react";

export default function ReminderToggle({ habit, index, save }) {
  const r = habit.reminder || { enabled: false, time: "09:00", days: [1,2,3,4,5] };

  const dayNames = useMemo(() => ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], []);

  const update = (next) => {
    const newHabit = { ...habit, reminder: { ...r, ...next } };
    save(prev => {
      const list = Array.isArray(prev) ? prev : [];
      return list.map((h, i) => i === index ? newHabit : h);
    });
  };

  const toggleDay = (d) => {
    const days = Array.isArray(r.days) ? [...r.days] : [];
    const exists = days.includes(d);
    const nextDays = exists ? days.filter(x => x !== d) : [...days, d];
    update({ days: nextDays.sort((a,b) => a-b) });
  };

  return (
    <div className="inline-flex items-center gap-2">
      <label className="flex items-center gap-1 text-sm">
        <input type="checkbox" checked={!!r.enabled} onChange={e => update({ enabled: e.target.checked })} />
        Remind
      </label>
      <input type="time" className="text-sm border rounded px-2 py-1" value={r.time || "09:00"} onChange={e => update({ time: e.target.value })} />
      <div className="flex gap-1">
        {dayNames.map((n, i) => (
          <button key={n} onClick={() => toggleDay(i)} className={`text-xs px-2 py-1 rounded ${r.days?.includes(i) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{n[0]}</button>
        ))}
      </div>
    </div>
  );
}


