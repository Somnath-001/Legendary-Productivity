import React, { useEffect, useMemo, useState } from "react";

function normalizeTasks(list) {
  if (!Array.isArray(list)) return [];
  return list.map((t) => {
    const id = t.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const text = typeof t.text === "string" ? t.text : "";
    const done = !!t.done;
    const priority = t.priority === "H" || t.priority === "L" ? t.priority : "M";
    const dueDate = typeof t.dueDate === "string" ? t.dueDate : "";
    const tags = Array.isArray(t.tags) ? t.tags : [];
    const bucket = t.bucket === "today" || t.bucket === "later" ? t.bucket : (t.bucket === "next" ? "next" : "next");
    const createdAt = typeof t.createdAt === "number" ? t.createdAt : Date.now();
    return { id, text, done, priority, dueDate, tags, bucket, createdAt };
  });
}

function saveTasks(list) {
  try { localStorage.setItem("ldt:tasks", JSON.stringify(list)); } catch {}
}

function compareTasks(a, b) {
  // not done first
  if (a.done !== b.done) return a.done ? 1 : -1;
  // priority H > M > L
  const order = { H: 0, M: 1, L: 2 };
  if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
  // earliest due date first (empty due at end)
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate && !b.dueDate) return -1;
  if (!a.dueDate && b.dueDate) return 1;
  // then by createdAt
  return a.createdAt - b.createdAt;
}

export default function TodoList() {
  const [tasks, setTasks] = useState(() => {
    try { return normalizeTasks(JSON.parse(localStorage.getItem("ldt:tasks") || "[]")); } catch { return []; }
  });

  const [text, setText] = useState("");
  const [priority, setPriority] = useState("M");
  const [bucket, setBucket] = useState("today");
  const [dueDate, setDueDate] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => { saveTasks(tasks); }, [tasks]);

  const grouped = useMemo(() => {
    const today = [];
    const next = [];
    const later = [];
    for (const t of tasks) {
      if (t.bucket === "today") today.push(t);
      else if (t.bucket === "later") later.push(t);
      else next.push(t);
    }
    return {
      today: today.sort(compareTasks),
      next: next.sort(compareTasks),
      later: later.sort(compareTasks),
    };
  }, [tasks]);

  const add = () => {
    const txt = text.trim();
    if (!txt) return;
    const tags = tagsInput.split(",").map(s => s.trim()).filter(Boolean);
    const newTask = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: txt,
      done: false,
      priority,
      dueDate,
      tags,
      bucket,
      createdAt: Date.now(),
    };
    setTasks([...tasks, newTask]);
    setText("");
    setDueDate("");
    setTagsInput("");
    setPriority("M");
    setBucket("today");
  };

  const updateById = (id, changes) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...changes } : t));
  };

  const toggleById = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const removeById = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const PriorityBadge = ({ p }) => {
    const style = p === "H" ? "bg-red-100 text-red-700" : p === "L" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700";
    const label = p === "H" ? "High" : p === "L" ? "Low" : "Med";
    return <span className={`text-xs px-2 py-1 rounded ${style}`}>{label}</span>;
  };

  const TaskRow = ({ t }) => {
    const overdue = !!t.dueDate && !t.done && new Date(t.dueDate) < new Date(new Date().toDateString());
    return (
      <li className="p-2 border rounded">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <input type="checkbox" checked={t.done} onChange={() => toggleById(t.id)} />
            <span className={`truncate ${t.done ? "line-through text-slate-400" : ""}`}>{t.text}</span>
            <PriorityBadge p={t.priority} />
            {t.dueDate && (
              <span className={`text-xs px-2 py-1 rounded ${overdue ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{t.dueDate}</span>
            )}
            {t.tags?.length > 0 && (
              <span className="text-xs text-slate-500">#{t.tags.join(" #")}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select className="text-xs border rounded px-1 py-1" value={t.priority} onChange={(e) => updateById(t.id, { priority: e.target.value })}>
              <option value="H">High</option>
              <option value="M">Med</option>
              <option value="L">Low</option>
            </select>
            <input type="date" className="text-xs border rounded px-2 py-1" value={t.dueDate || ""} onChange={(e) => updateById(t.id, { dueDate: e.target.value })} />
            <select className="text-xs border rounded px-1 py-1" value={t.bucket} onChange={(e) => updateById(t.id, { bucket: e.target.value })}>
              <option value="today">Today</option>
              <option value="next">Next</option>
              <option value="later">Later</option>
            </select>
            <button onClick={() => removeById(t.id)} className="text-sm text-red-500">Delete</button>
          </div>
        </div>
      </li>
    );
  };

  const Section = ({ title, items }) => (
    <div>
      <div className="flex items-center justify-between mt-6 mb-2">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs text-slate-400">{items.length} tasks</span>
      </div>
      <ul className="space-y-2">
        {items.length === 0 && <li className="text-slate-400 text-sm">Empty</li>}
        {items.map((t) => <TaskRow key={t.id} t={t} />)}
      </ul>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h2 className="text-xl font-semibold mb-4">🗒️ To-Do List</h2>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
        <input className="md:col-span-2 border px-3 py-2 rounded" value={text} onChange={e => setText(e.target.value)} placeholder="Add a task (verb-first, e.g. Draft report)" />
        <select className="border px-2 py-2 rounded" value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="H">High</option>
          <option value="M">Med</option>
          <option value="L">Low</option>
        </select>
        <input type="date" className="border px-2 py-2 rounded" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        <select className="border px-2 py-2 rounded" value={bucket} onChange={e => setBucket(e.target.value)}>
          <option value="today">Today</option>
          <option value="next">Next</option>
          <option value="later">Later</option>
        </select>
        <input className="md:col-span-4 border px-3 py-2 rounded" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Tags (comma separated)" />
        <button onClick={add} className="md:col-span-1 px-4 py-2 bg-green-500 text-white rounded">Add</button>
      </div>

      <Section title="Today (MITs)" items={grouped.today} />
      <Section title="Next" items={grouped.next} />
      <Section title="Later" items={grouped.later} />
    </div>
  );
}
