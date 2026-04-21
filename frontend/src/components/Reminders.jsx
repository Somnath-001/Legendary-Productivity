import React, { useEffect, useState } from "react";
import { registerServiceWorker, subscribePush, unsubscribePush, sendTestPush } from "../services/push";

function load() {
  try { return JSON.parse(localStorage.getItem("ldt:reminders") || "[]"); } catch { return []; }
}

function saveList(list) {
  try { localStorage.setItem("ldt:reminders", JSON.stringify(list)); } catch {}
  try { window.dispatchEvent(new Event("ldt:update")); } catch {}
}

export default function Reminders() {
  const [reminders, setReminders] = useState(() => load());
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [days, setDays] = useState([1,2,3,4,5]);
  const [enabled, setEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ldt:remindersSound") || "false"); } catch { return false; }
  });
  const [snoozeMin, setSnoozeMin] = useState(() => {
    try { return parseInt(localStorage.getItem("ldt:remindersSnoozeMin") || "5", 10) || 5; } catch { return 5; }
  });

  useEffect(() => { saveList(reminders); }, [reminders]);
  useEffect(() => { 
    registerServiceWorker(); 
    // Request notification permission on component mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const toggleDay = (d) => {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a,b) => a-b));
  };

  const addReminder = () => {
    if (!title.trim()) return;
    setReminders([...reminders, { id: Date.now(), title: title.trim(), time, days, enabled, body: "" }]);
    setTitle("");
  };

  const removeReminder = (id) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const updateReminder = (id, next) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, ...next } : r));
  };

  const dayNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h2 className="text-xl font-semibold mb-4">🔔 Reminders</h2>

      <div className="p-3 mb-4 rounded bg-slate-50 border">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={soundEnabled} onChange={e => { setSoundEnabled(e.target.checked); localStorage.setItem("ldt:remindersSound", JSON.stringify(e.target.checked)); }} />
            Enable sound
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Snooze minutes</span>
            <input type="number" min={1} max={60} className="w-20 border rounded px-2 py-1" value={snoozeMin} onChange={e => { const v = Math.max(1, Math.min(60, parseInt(e.target.value || '5', 10))); setSnoozeMin(v); localStorage.setItem("ldt:remindersSnoozeMin", String(v)); }} />
          </div>
          <button className="px-3 py-1 bg-slate-200 rounded text-sm" onClick={async () => {
            try {
              const AC = window.AudioContext || window.webkitAudioContext;
              if (!AC) return;
              const ctx = new AC();
              if (ctx.state === 'suspended') {
                await ctx.resume();
              }
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.type = 'sine'; 
              o.frequency.value = 880;
              g.gain.setValueAtTime(0.0001, ctx.currentTime);
              g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
              g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
              o.connect(g); 
              g.connect(ctx.destination);
              o.start(); 
              o.stop(ctx.currentTime + 0.65);
            } catch (e) {
              console.error('Sound test failed:', e);
            }
          }}>Test sound</button>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-indigo-600 text-white rounded text-sm" onClick={async () => {
              try { 
                await subscribePush(); 
                alert('Push notifications enabled successfully!'); 
              } catch (e) { 
                console.error('Push subscription failed:', e);
                alert('Enable push failed: ' + (e.message || e)); 
              }
            }}>Enable push</button>
            <button className="px-3 py-1 bg-slate-200 rounded text-sm" onClick={async () => { 
              try {
                await unsubscribePush(); 
                alert('Push notifications disabled'); 
              } catch (e) {
                console.error('Push unsubscription failed:', e);
                alert('Disable push failed: ' + e.message);
              }
            }}>Disable push</button>
            <button className="px-3 py-1 bg-slate-200 rounded text-sm" onClick={async () => { 
              try { 
                await sendTestPush(); 
                alert('Test push sent!');
              } catch (e) {
                console.error('Test push failed:', e);
                alert('Test push failed: ' + e.message);
              }
            }}>Test push</button>
          </div>
        </div>
      </div>

      <div className="p-3 mb-4 rounded bg-slate-50 border">
        <h3 className="font-semibold mb-2">Calendar defaults</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Minutes before event</span>
          <input type="number" min={0} max={1440} className="w-24 border rounded px-2 py-1" defaultValue={(() => {
            try { return parseInt(localStorage.getItem('ldt:calendarDefaultRemindMin') || '15',10) || 15; } catch { return 15; }
          })()} onBlur={(e) => {
            const v = Math.max(0, Math.min(1440, parseInt(e.target.value || '15', 10)));
            e.target.value = String(v);
            localStorage.setItem('ldt:calendarDefaultRemindMin', String(v));
          }} />
          <span className="text-xs text-slate-400">Applied when creating new events; can be edited per event.</span>
        </div>
      </div>

      <div className="p-3 mb-4 rounded bg-slate-50 border">
        <h3 className="font-semibold mb-2">Daily agenda</h3>
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" defaultChecked={(() => { try { return JSON.parse(localStorage.getItem('ldt:agendaEnabled') || 'false'); } catch { return false; } })()} onChange={e => localStorage.setItem('ldt:agendaEnabled', JSON.stringify(e.target.checked))} />
            Enable agenda notification
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Time</span>
            <input type="time" className="border rounded px-2 py-1" defaultValue={(() => localStorage.getItem('ldt:agendaTime') || '08:30')()} onBlur={e => localStorage.setItem('ldt:agendaTime', e.target.value || '08:30')} />
          </div>
          <button className="px-3 py-1 bg-slate-200 rounded text-sm" onClick={async () => {
            try {
              console.log('Preview button clicked');
              
              if (!('Notification' in window)) {
                alert('Notifications not supported in this browser');
                return;
              }
              
              console.log('Current notification permission:', Notification.permission);
              
              if (Notification.permission === 'default') {
                console.log('Requesting notification permission...');
                const permission = await Notification.requestPermission();
                console.log('Permission result:', permission);
                if (permission !== 'granted') {
                  alert('Notification permission denied');
                  return;
                }
              }
              
              if (Notification.permission === 'granted') {
                console.log('Permission granted, building agenda...');
                
                // Build actual agenda content like the real function
                const buildAgendaText = () => {
                  // Events today
                  let eventsToday = [];
                  try {
                    const all = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
                    const todayYmd = new Date().toISOString().slice(0, 10);
                    console.log('All calendar events:', all);
                    console.log('Today date:', todayYmd);
                    
                    eventsToday = all.filter(ev => {
                      if (!ev || !ev.start) return false;
                      const ymd = String(ev.start).slice(0, 10);
                      return ymd === todayYmd;
                    }).slice(0, 5);
                    console.log('Events today:', eventsToday);
                  } catch (e) {
                    console.error('Error parsing calendar events:', e);
                  }

                  // MITs from tasks bucket 'today'
                  let mits = [];
                  try {
                    const tasks = JSON.parse(localStorage.getItem('ldt:tasks') || '[]');
                    console.log('All tasks:', tasks);
                    
                    const today = (Array.isArray(tasks) ? tasks : []).filter(t => t && t.bucket === 'today' && !t.done);
                    console.log('Today tasks:', today);
                    
                    // Sort by priority
                    const compareTasks = (a, b) => {
                      if (a.done !== b.done) return a.done ? 1 : -1;
                      const order = { H: 0, M: 1, L: 2 };
                      const ap = order[a.priority || 'M'];
                      const bp = order[b.priority || 'M'];
                      if (ap !== bp) return ap - bp;
                      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
                      if (a.dueDate && !b.dueDate) return -1;
                      if (!a.dueDate && b.dueDate) return 1;
                      return (a.createdAt || 0) - (b.createdAt || 0);
                    };
                    today.sort(compareTasks);
                    mits = today.slice(0, 3);
                    console.log('Top MITs:', mits);
                  } catch (e) {
                    console.error('Error parsing tasks:', e);
                  }

                  const evPart = eventsToday.length > 0
                    ? `Events: ${eventsToday.map(e => e.title).join('; ')}`
                    : 'Events: none';
                  const mitPart = mits.length > 0
                    ? `MITs: ${mits.map(t => t.text).join('; ')}`
                    : 'MITs: none';
                  
                  const result = `${evPart}\n${mitPart}`;
                  console.log('Final agenda text:', result);
                  return result;
                };

                const body = buildAgendaText();
                console.log('Creating notification with body:', body);
                
                const n = new Notification("Today's Agenda", { 
                  body,
                  icon: '/vite.svg',
                  badge: '/vite.svg',
                  requireInteraction: true,
                  silent: false
                });
                console.log('Notification created:', n);
                
                setTimeout(() => {
                  n.close && n.close();
                  console.log('Notification closed after 15 seconds');
                }, 15000);
                
                alert('Preview notification sent! Check for popup.');
              } else {
                alert('Notification permission not granted');
              }
            } catch (e) {
              console.error('Preview failed:', e);
              alert('Preview failed: ' + e.message);
            }
          }}>Preview</button>
        </div>
        <div className="text-xs text-slate-500 mt-2">Agenda includes up to 5 calendar events and your top 3 Today MITs.</div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-2 mb-4">
        <div className="flex-1">
          <label className="block text-xs text-slate-500">Title</label>
          <input className="w-full border rounded px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Morning Workout" />
        </div>
        <div>
          <label className="block text-xs text-slate-500">Time</label>
          <input type="time" className="border rounded px-3 py-2" value={time} onChange={e => setTime(e.target.value)} />
        </div>
        <div className="flex items-center gap-1">
          {dayNames.map((n, i) => (
            <button key={n} onClick={() => toggleDay(i)} className={`text-xs px-2 py-2 rounded ${days.includes(i) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{n[0]}</button>
          ))}
        </div>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} /> Enabled
        </label>
        <button onClick={addReminder} className="px-4 py-2 bg-emerald-500 text-white rounded">Add</button>
      </div>

      <ul className="space-y-2">
        {reminders.length === 0 && <li className="text-slate-400">No reminders yet.</li>}
        {reminders.map(r => (
          <li key={r.id} className="p-3 border rounded flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex-1">
              <input className="font-medium w-full md:w-auto" value={r.title} onChange={e => updateReminder(r.id, { title: e.target.value })} />
              <div className="text-xs text-slate-500">{r.days?.map(d => dayNames[d]).join(', ') || 'No days selected'}</div>
            </div>
            <div className="flex items-center gap-3">
              <input type="time" value={r.time || '09:00'} onChange={e => updateReminder(r.id, { time: e.target.value })} />
              <label className="inline-flex items-center gap-1 text-sm">
                <input type="checkbox" checked={!!r.enabled} onChange={e => updateReminder(r.id, { enabled: e.target.checked })} />
                Enabled
              </label>
              <button className="text-red-500 text-sm" onClick={() => removeReminder(r.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


