import React, { useMemo, useState } from "react";
import ExportPDF from "./PDFExport";

export default function HabitTracker() {
  const [habits, setHabits] = useState(() => {
    try {
      const raw = localStorage.getItem("ldt:habits");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });
  const [newHabit, setNewHabit] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingName, setEditingName] = useState("");

  const startOfWeek = (baseDate) => {
    const d = new Date(baseDate);
    const dow = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dow);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const ymd = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  const currentWeek = useMemo(() => {
    const sow = startOfWeek(new Date());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sow);
      d.setDate(sow.getDate() + i);
      days.push({ date: d, key: ymd(d), label: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i] });
    }
    return days;
  }, []);

  const withComputedWeek = (list) => {
    const arr = Array.isArray(list) ? list : [];
    return arr.map(h => {
      const history = Array.isArray(h.history) ? h.history : [];
      const completedDays = currentWeek
        .map((d, idx) => ({ idx, done: history.includes(d.key) || (h.completedDays || []).includes(idx) }))
        .filter(x => x.done)
        .map(x => x.idx);
      return {
        name: h.name,
        goalPerWeek: typeof h.goalPerWeek === "number" ? h.goalPerWeek : 5,
        history,
        createdAt: h.createdAt || Date.now(),
        completedDays,
      };
    });
  };

  const save = (nextOrUpdater) => {
    const nextRaw = typeof nextOrUpdater === 'function' ? nextOrUpdater(habits) : nextOrUpdater;
    const next = withComputedWeek(nextRaw);
    setHabits(next);
    try { localStorage.setItem("ldt:habits", JSON.stringify(next)); } catch {}
    try { window.dispatchEvent(new Event("ldt:update")); } catch {}
  };

  const addHabit = () => {
    if (!newHabit.trim()) return;
    const next = [...habits, { name: newHabit.trim(), goalPerWeek: 5, history: [], createdAt: Date.now(), completedDays: [] }];
    save(next);
    setNewHabit("");
  };

  const toggleDay = (habitIndex, dayIndex) => {
    const weekKey = currentWeek[dayIndex]?.key;
    if (!weekKey) return;
    const next = habits.map((h, i) => {
      if (i !== habitIndex) return h;
      const history = Array.isArray(h.history) ? [...h.history] : [];
      const exists = history.includes(weekKey);
      const updatedHistory = exists ? history.filter(k => k !== weekKey) : [...history, weekKey];
      return { ...h, history: updatedHistory };
    });
    save(next);
  };

  const clearAll = () => {
    if (!confirm("Clear all habits?")) return;
    save([]);
  };

  const removeHabit = (i) => {
    const name = habits[i]?.name || "this habit";
    if (!confirm(`Delete ${name}?`)) return;
    save(habits.filter((_, idx) => idx !== i));
  };

  const beginEdit = (i) => {
    setEditingIndex(i);
    setEditingName(habits[i]?.name || "");
  };

  const commitEdit = () => {
    if (editingIndex == null) return;
    const trimmed = editingName.trim();
    if (!trimmed) { setEditingIndex(null); return; }
    const next = habits.map((h, i) => i === editingIndex ? { ...h, name: trimmed } : h);
    save(next);
    setEditingIndex(null);
  };

  const changeGoal = (i, delta) => {
    const next = habits.map((h, idx) => {
      if (idx !== i) return h;
      const g = Math.max(1, Math.min(7, (h.goalPerWeek || 5) + delta));
      return { ...h, goalPerWeek: g };
    });
    save(next);
  };

  const markToday = (i) => {
    const dow = (new Date().getDay() + 6) % 7;
    toggleDay(i, dow);
  };

  const computeStreak = (history) => {
    const set = new Set(history || []);
    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0,0,0,0);
    while (set.has(ymd(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">🔥 Habit Tracker</h2>
        <div className="flex gap-2">
          <button onClick={clearAll} className="text-sm text-red-500 hover:underline">Clear</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="Add new habit (e.g. Morning Workout)"
          className="flex-grow border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <button onClick={addHabit} className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600">Add</button>
      </div>

      <div className="overflow-x-auto mb-4">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-3 text-left">Habit</th>
              {currentWeek.map((d) => (
                <th key={d.key} className="p-2 text-center text-sm">{d.label}</th>
              ))}
              <th className="p-3 text-center text-sm">Goal</th>
              <th className="p-3 text-center text-sm">Streak</th>
              <th className="p-3 text-right text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {habits.length === 0 && (
              <tr>
                <td colSpan={12} className="p-6 text-center text-slate-400">No habits yet — add one above.</td>
              </tr>
            )}
            {habits.map((habit, i) => (
              <tr key={i} className="border-t">
                <td className="p-3 font-medium">
                  {editingIndex === i ? (
                    <div className="flex items-center gap-2">
                      <input className="border px-2 py-1 rounded w-full" value={editingName} onChange={(e) => setEditingName(e.target.value)} onBlur={commitEdit} onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); }} autoFocus />
                    </div>
                  ) : (
                    <button onClick={() => beginEdit(i)} className="text-left hover:underline">{habit.name}</button>
                  )}
                </td>
                {currentWeek.map((_, dayIndex) => (
                  <td
                    key={dayIndex}
                    className="p-2 text-center cursor-pointer select-none"
                    onClick={() => toggleDay(i, dayIndex)}
                  >
                    <div className={`inline-flex items-center justify-center w-7 h-7 rounded ${habit.completedDays?.includes(dayIndex) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {habit.completedDays?.includes(dayIndex) ? "✓" : ""}
                    </div>
                  </td>
                ))}
                <td className="p-2 text-center">
                  <div className="inline-flex items-center gap-2">
                    <button className="px-2 py-1 bg-slate-100 rounded" onClick={() => changeGoal(i, -1)}>-</button>
                    <span className="text-sm">{habit.goalPerWeek || 5}/wk</span>
                    <button className="px-2 py-1 bg-slate-100 rounded" onClick={() => changeGoal(i, 1)}>+</button>
                  </div>
                </td>
                <td className="p-2 text-center">
                  <span className="text-sm">{computeStreak(habit.history)}</span>
                </td>
                <td className="p-2 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button className="text-sm px-3 py-1 bg-emerald-500 text-white rounded" onClick={() => markToday(i)}>Today</button>
                    <button className="text-sm text-indigo-600 hover:underline" onClick={() => beginEdit(i)}>Rename</button>
                    <button className="text-sm text-red-500 hover:underline" onClick={() => removeHabit(i)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center">
        <ExportPDF habits={habits} />
      </div>
    </div>
  );
}
