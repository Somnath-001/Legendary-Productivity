import React, { useState } from "react";
import HabitTracker from "../components/HabitTracker";
import TodoList from "../components/TodoList";
import PomodoroTimer from "../components/PomodoroTimer";
import CalendarView from "../components/CalendarView";
import Analytics from "../components/Analytics";
import AIAssistant from "../components/AIAssistant";
import ReminderScheduler from "../components/ReminderScheduler";
import Reminders from "../components/Reminders";
import HybridDashboard from "../components/HybridDashboard";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("habits");

  const tabs = [
    { id: "habits", label: "Habit Tracker" },
    { id: "todo", label: "To-Do List" },
    { id: "pomodoro", label: "Pomodoro" },
    { id: "calendar", label: "Calendar" },
    { id: "analytics", label: "Analytics" },
    { id: "reminders", label: "Reminders" },
    { id: "ai", label: "AI Assistant" },
    { id: "hybrid", label: "Hybrid Athlete" },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "habits":
        return <HabitTracker />;
      case "todo":
        return <TodoList />;
      case "pomodoro":
        return <PomodoroTimer />;
      case "calendar":
        return <CalendarView />;
      case "analytics":
        return <Analytics />;
      case "reminders":
        return <Reminders />;
      case "ai":
        return <AIAssistant />;
      case "hybrid":
        return <HybridDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <ReminderScheduler />
        <header className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold">
            🚀 Legendary Productivity Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Habits · Deep Work · Pomodoro · AI · Calendar
          </p>
        </header>

        <nav className="flex gap-2 justify-center mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === t.id
                ? "bg-indigo-600 text-white shadow"
                : "bg-white text-slate-700 border border-slate-200 hover:shadow-sm"
                }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <main>{renderTab()}</main>
      </div>
    </div>
  );
}
