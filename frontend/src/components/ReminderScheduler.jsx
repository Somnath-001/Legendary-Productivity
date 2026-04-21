import React, { useEffect, useRef } from "react";

function getReminders() {
  try { return JSON.parse(localStorage.getItem("ldt:reminders") || "[]"); } catch { return []; }
}

function getSettings() {
  try {
    return {
      soundEnabled: JSON.parse(localStorage.getItem("ldt:remindersSound") || "false"),
      snoozeMin: parseInt(localStorage.getItem("ldt:remindersSnoozeMin") || "5", 10) || 5,
    };
  } catch {
    return { soundEnabled: false, snoozeMin: 5 };
  }
}

function getSnoozed() {
  try { return JSON.parse(localStorage.getItem("ldt:remindersSnoozed") || "[]"); } catch { return []; }
}

function saveSnoozed(list) {
  try { localStorage.setItem("ldt:remindersSnoozed", JSON.stringify(list)); } catch {}
}

function requestPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

function msUntil(timeStr) {
  // timeStr: "HH:MM" in 24h
  const [hh, mm] = (timeStr || "09:00").split(":").map(n => parseInt(n, 10));
  const now = new Date();
  const next = new Date();
  next.setHours(hh, mm, 0, 0);
  let diffMs = next - now;
  if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // next day
  return diffMs;
}

export default function ReminderScheduler() {
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const firedTodayRef = useRef({});
  const firedEventsRef = useRef({});

  const getAgendaSettings = () => {
    try {
      return {
        enabled: JSON.parse(localStorage.getItem('ldt:agendaEnabled') || 'false'),
        time: localStorage.getItem('ldt:agendaTime') || '08:30',
      };
    } catch {
      return { enabled: false, time: '08:30' };
    }
  };

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

  const buildAgendaText = () => {
    // Events today
    let eventsToday = [];
    try {
      const all = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
      const todayYmd = new Date().toISOString().slice(0, 10);
      eventsToday = all.filter(ev => {
        if (!ev || !ev.start) return false;
        const ymd = String(ev.start).slice(0, 10);
        return ymd === todayYmd;
      }).slice(0, 5);
    } catch {}

    // MITs from tasks bucket 'today'
    let mits = [];
    try {
      const tasks = JSON.parse(localStorage.getItem('ldt:tasks') || '[]');
      const today = (Array.isArray(tasks) ? tasks : []).filter(t => t && t.bucket === 'today' && !t.done);
      today.sort(compareTasks);
      mits = today.slice(0, 3);
    } catch {}

    const evPart = eventsToday.length > 0
      ? `Events: ${eventsToday.map(e => e.title).join('; ')}`
      : 'Events: none';
    const mitPart = mits.length > 0
      ? `MITs: ${mits.map(t => t.text).join('; ')}`
      : 'MITs: none';
    return `${evPart}\n${mitPart}`;
  };

  const ensureAudio = async () => {
    try {
      if (!audioCtxRef.current) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        audioCtxRef.current = new AC();
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch { return null; }
  };

  const playChime = async () => {
    const { soundEnabled } = getSettings();
    if (!soundEnabled) return;
    const ctx = await ensureAudio();
    if (!ctx) return;
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
  };

  useEffect(() => {
    requestPermission();

    // Unlock audio on first user interaction so chimes can play in background tabs
    const unlock = async () => {
      try { await ensureAudio(); } catch {}
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);

    const tick = () => {
      const reminders = getReminders();
      const now = new Date();
      const dow = (now.getDay() + 6) % 7; // Mon=0

      // fire scheduled reminders
      reminders.forEach(r => {
        if (!r || !r.enabled) return;
        if (Array.isArray(r.days) && r.days.length > 0 && !r.days.includes(dow)) return;

        const ms = msUntil(r.time || "09:00");
        // fire within 30s window
        const key = `${r.id || r.title}-${now.toDateString()}`;
        if (ms >= 0 && ms < 30000 && !firedTodayRef.current[key]) {
          firedTodayRef.current[key] = true;
          try {
            if (Notification && Notification.permission === "granted") {
              const n = new Notification("Habit Reminder", {
                body: r.body || `Time for: ${r.title || 'habit'}`,
              });
              setTimeout(() => n.close && n.close(), 10000);
              // snooze on click
              const { snoozeMin } = getSettings();
              n.onclick = () => {
                try { window.focus && window.focus(); } catch {}
                const list = getSnoozed();
                const atTs = Date.now() + (snoozeMin * 60000);
                list.push({ id: r.id || r.title, atTs, title: r.title, body: r.body });
                saveSnoozed(list);
              };
            }
          } catch {}
          playChime();
        }
      });

      // handle snoozed reminders
      const snoozed = getSnoozed();
      const remaining = [];
      for (const s of snoozed) {
        if (!s || typeof s.atTs !== 'number') continue;
        const dt = s.atTs - Date.now();
        if (dt <= 0 && dt > -30000) {
          try {
            if (Notification && Notification.permission === "granted") {
              const n = new Notification("Snoozed Reminder", { body: s.body || `Time for: ${s.title || 'reminder'}` });
              setTimeout(() => n.close && n.close(), 10000);
            }
          } catch {}
          playChime();
          // do not re-add, it's fired
        } else if (dt > 0) {
          remaining.push(s);
        }
      }
      if (remaining.length !== snoozed.length) saveSnoozed(remaining);

      // calendar events reminders
      try {
        const calEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
        const defaultMin = parseInt(localStorage.getItem('ldt:calendarDefaultRemindMin') || '15', 10) || 15;
        for (const ev of calEvents) {
          if (!ev || !ev.start) continue;
          const mBefore = typeof ev.remindMinutesBefore === 'number' ? ev.remindMinutesBefore : defaultMin;
          if (mBefore < 0) continue;
          const start = new Date(ev.start);
          const fireTs = start.getTime() - mBefore * 60000;
          const dt = fireTs - Date.now();
          const key = `cal-${ev.id || ev.title}-${fireTs}`;
          if (dt >= 0 && dt < 30000 && !firedEventsRef.current[key]) {
            firedEventsRef.current[key] = true;
            try {
              if (Notification && Notification.permission === 'granted') {
                const n = new Notification('Upcoming event', { body: `${ev.title} in ${mBefore} min` });
                setTimeout(() => n.close && n.close(), 10000);
              }
            } catch {}
            playChime();
          }
        }
      } catch {}

      // daily agenda notification (once per day at configured time)
      try {
        const { enabled, time } = getAgendaSettings();
        if (enabled) {
          const nowStr = new Date().toISOString().slice(0, 10);
          const key = `agenda-${nowStr}`;
          const ms = msUntil(time || '08:30');
          if (ms >= 0 && ms < 30000 && !firedTodayRef.current[key]) {
            firedTodayRef.current[key] = true;
            const body = buildAgendaText();
            try {
              if (Notification && Notification.permission === 'granted') {
                const n = new Notification('Today\'s Agenda', { body });
                setTimeout(() => n.close && n.close(), 15000);
              }
            } catch {}
            playChime();
          }
        }
      } catch {}
    };

    tick();
    timerRef.current = setInterval(tick, 30000); // check every 30s
    const onUpdate = () => tick();
    window.addEventListener("ldt:update", onUpdate);
    return () => {
      clearInterval(timerRef.current);
      window.removeEventListener("ldt:update", onUpdate);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return null;
}


