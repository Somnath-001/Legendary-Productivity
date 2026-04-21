import React, { useEffect, useState, useRef } from "react";

export default function PomodoroTimer() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("work"); // work | short | long
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now() - pausedTimeRef.current;
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = Math.max(0, (mode === "work" ? 25*60 : mode === "short" ? 5*60 : 90*60) - elapsed);
        setSeconds(remaining);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      if (startTimeRef.current) {
        pausedTimeRef.current = Date.now() - startTimeRef.current;
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  useEffect(() => {
    if (seconds <= 0) {
      // log completed deep work session before switching mode
      try {
        if (mode === "work" || mode === "long") {
          const previousSessions = JSON.parse(localStorage.getItem("ldt:deepwork") || "[]");
          const minutes = mode === "long" ? 90 : 25;
          previousSessions.push({ ts: Date.now(), minutes });
          localStorage.setItem("ldt:deepwork", JSON.stringify(previousSessions));
        }
      } catch {}

      // simple auto-switch
      if (mode === "work") {
        setMode("short");
        setSeconds(5 * 60);
      } else {
        setMode("work");
        setSeconds(25 * 60);
      }
      setRunning(false);
      // notify
      if (Notification && Notification.permission === "granted") {
        new Notification("Pomodoro", { body: "Session ended — take a break or start next." });
      }
    }
  }, [seconds, mode]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;

  return (
    <div className="bg-white p-6 rounded-2xl shadow text-center">
      <h2 className="text-xl font-semibold mb-4">⏱ Pomodoro</h2>
      <div className="text-5xl font-bold mb-4">{mm}:{ss < 10 ? `0${ss}` : ss}</div>
      <div className="flex gap-2 justify-center mb-4">
        <button onClick={() => { setMode("work"); setSeconds(25*60); pausedTimeRef.current = 0; }} className="px-3 py-2 bg-slate-100 rounded">25m</button>
        <button onClick={() => { setMode("short"); setSeconds(5*60); pausedTimeRef.current = 0; }} className="px-3 py-2 bg-slate-100 rounded">5m</button>
        <button onClick={() => { setMode("long"); setSeconds(90*60); pausedTimeRef.current = 0; }} className="px-3 py-2 bg-slate-100 rounded">90m</button>
      </div>
      <div className="flex gap-2 justify-center">
        <button onClick={() => setRunning(r => !r)} className="px-4 py-2 bg-indigo-600 text-white rounded">{running ? "Pause" : "Start"}</button>
        <button onClick={() => { setRunning(false); setSeconds(mode === "work" ? 25*60 : mode === "short" ? 5*60 : 90*60); pausedTimeRef.current = 0; }} className="px-4 py-2 bg-red-500 text-white rounded">Reset</button>
      </div>
    </div>
  );
}
