// frontend/src/components/CalendarView.jsx
import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const calendarRef = useRef(null);

  const getDefaultReminderMin = () => {
    try { return parseInt(localStorage.getItem("ldt:calendarDefaultRemindMin") || "15", 10) || 15; } catch { return 15; }
  };

  // Enhanced event loading with migration support
  useEffect(() => {
    const loadEvents = () => {
      try {
        // Try to load from the main calendar storage
        let storedEvents = JSON.parse(localStorage.getItem("calendarEvents")) || [];
        
        // If no events, try loading from backup locations
        if (storedEvents.length === 0) {
          storedEvents = JSON.parse(localStorage.getItem("ldt:calendarEvents")) || [];
        }
        
        // Migrate old event format to new format if needed
        storedEvents = storedEvents.map(event => ({
          id: event.id || Date.now() + Math.random(),
          title: event.title || 'Untitled Event',
          start: event.start || new Date().toISOString(),
          end: event.end || null,
          remindMinutesBefore: event.remindMinutesBefore || getDefaultReminderMin(),
          allDay: event.allDay || false,
          color: event.color || '#3788d8',
          description: event.description || '',
          location: event.location || '',
          createdAt: event.createdAt || Date.now(),
          updatedAt: event.updatedAt || Date.now()
        }));
        
        setEvents(storedEvents);
        
        // Save migrated events back to storage
        if (storedEvents.length > 0) {
          localStorage.setItem("calendarEvents", JSON.stringify(storedEvents));
        }
        
        console.log('Loaded calendar events:', storedEvents.length);
      } catch (error) {
        console.error('Error loading calendar events:', error);
        setEvents([]);
      }
    };
    
    loadEvents();
  }, []);

  // Enhanced event saving with backup
  useEffect(() => {
    if (events.length > 0) {
      try {
        // Save to main storage
        localStorage.setItem("calendarEvents", JSON.stringify(events));
        
        // Create backup
        localStorage.setItem("ldt:calendarEvents", JSON.stringify(events));
        
        // Save with timestamp for recovery
        localStorage.setItem("ldt:calendarEventsBackup", JSON.stringify({
          events,
          timestamp: Date.now()
        }));
        
        console.log('Saved calendar events:', events.length);
      } catch (error) {
        console.error('Error saving calendar events:', error);
      }
    }
  }, [events]);

  const handleDateClick = (info) => {
    const title = prompt("Enter event title:");
    if (!title) return;
    
    const time = prompt("Enter start time (HH:MM) or leave blank for all-day:") || "";
    const timeOk = /^\d{2}:\d{2}$/.test(time);
    const start = timeOk ? `${info.dateStr}T${time}:00` : info.dateStr;
    
    const description = prompt("Enter event description (optional):") || "";
    const location = prompt("Enter event location (optional):") || "";
    
    const newEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      start,
      end: null,
      remindMinutesBefore: getDefaultReminderMin(),
      allDay: !timeOk,
      color: '#3788d8',
      description: description.trim(),
      location: location.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    setEvents([...events, newEvent]);
    console.log('Created new event:', newEvent);
  };

  const handleEventClick = (info) => {
    const event = events.find(e => e.id === info.event.id);
    const action = prompt(
      `Manage: "${info.event.title}"\nType one: 'title' | 'time' | 'reminder' | 'description' | 'location' | 'color' | 'delete'`
    );
    if (!action) return;
    const act = action.toLowerCase();
    
    if (act === 'title') {
      const newTitle = prompt("Enter new title:", info.event.title);
      if (!newTitle) return;
      setEvents(events.map(e => e.id === info.event.id ? { ...e, title: newTitle.trim(), updatedAt: Date.now() } : e));
    } else if (act === 'time') {
      const currentStart = event?.start || '';
      const currentDate = (currentStart || '').slice(0,10);
      const currentTime = (currentStart.includes('T') ? currentStart.slice(11,16) : '');
      const dateStr = prompt("Enter date (YYYY-MM-DD)", currentDate) || currentDate;
      const timeStr = prompt("Enter start time (HH:MM) or leave blank for all-day:", currentTime) || "";
      const timeOk = /^\d{2}:\d{2}$/.test(timeStr);
      const start = timeOk ? `${dateStr}T${timeStr}:00` : dateStr;
      setEvents(events.map(e => e.id === info.event.id ? { ...e, start, allDay: !timeOk, updatedAt: Date.now() } : e));
    } else if (act === 'reminder') {
      const current = event?.remindMinutesBefore ?? getDefaultReminderMin();
      const m = prompt("Minutes before to remind (e.g., 5, 10, 15)", String(current));
      if (m == null) return;
      const v = Math.max(0, parseInt(m, 10) || 0);
      setEvents(events.map(e => e.id === info.event.id ? { ...e, remindMinutesBefore: v, updatedAt: Date.now() } : e));
    } else if (act === 'description') {
      const current = event?.description || '';
      const newDescription = prompt("Enter event description:", current);
      if (newDescription !== null) {
        setEvents(events.map(e => e.id === info.event.id ? { ...e, description: newDescription.trim(), updatedAt: Date.now() } : e));
      }
    } else if (act === 'location') {
      const current = event?.location || '';
      const newLocation = prompt("Enter event location:", current);
      if (newLocation !== null) {
        setEvents(events.map(e => e.id === info.event.id ? { ...e, location: newLocation.trim(), updatedAt: Date.now() } : e));
      }
    } else if (act === 'color') {
      const colors = ['#3788d8', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
      const current = event?.color || '#3788d8';
      const colorIndex = prompt(`Choose color (0-7):\n0: Blue\n1: Red\n2: Teal\n3: Light Blue\n4: Green\n5: Yellow\n6: Pink\n7: Purple\nCurrent: ${current}`, '0');
      if (colorIndex !== null) {
        const selectedColor = colors[parseInt(colorIndex) || 0] || '#3788d8';
        setEvents(events.map(e => e.id === info.event.id ? { ...e, color: selectedColor, updatedAt: Date.now() } : e));
      }
    } else if (act === 'delete') {
      if (window.confirm(`Delete event '${info.event.title}'?`)) {
        setEvents(events.filter((event) => event.id !== info.event.id));
        console.log('Deleted event:', info.event.title);
      }
    }
  };

  const handleEventChange = (changeInfo) => {
    const updatedEvents = events.map((event) =>
      event.id === changeInfo.event.id
        ? { 
            ...event, 
            start: changeInfo.event.startStr, 
            end: changeInfo.event.endStr,
            updatedAt: Date.now()
          }
        : event
    );
    setEvents(updatedEvents);
    console.log('Event updated:', changeInfo.event.title);
  };

  // Add sample events for testing
  const addSampleEvents = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const sampleEvents = [
      {
        id: `sample_${Date.now()}_1`,
        title: "Team Meeting",
        start: `${today.toISOString().slice(0, 10)}T10:00:00`,
        end: `${today.toISOString().slice(0, 10)}T11:00:00`,
        remindMinutesBefore: 15,
        allDay: false,
        color: '#3788d8',
        description: "Weekly team standup meeting",
        location: "Conference Room A",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: `sample_${Date.now()}_2`,
        title: "Doctor Appointment",
        start: `${today.toISOString().slice(0, 10)}T14:00:00`,
        end: `${today.toISOString().slice(0, 10)}T15:00:00`,
        remindMinutesBefore: 30,
        allDay: false,
        color: '#ff6b6b',
        description: "Annual checkup",
        location: "Medical Center",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: `sample_${Date.now()}_3`,
        title: "Project Deadline",
        start: tomorrow.toISOString().slice(0, 10),
        end: tomorrow.toISOString().slice(0, 10),
        remindMinutesBefore: 60,
        allDay: true,
        color: '#feca57',
        description: "Submit final project deliverables",
        location: "",
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];
    
    setEvents([...events, ...sampleEvents]);
    console.log('Added sample events');
  };

  // Export events to JSON
  const exportEvents = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar-events-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    console.log('Exported events:', events.length);
  };

  // Import events from JSON
  const importEvents = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedEvents = JSON.parse(e.target.result);
            if (Array.isArray(importedEvents)) {
              setEvents([...events, ...importedEvents]);
              console.log('Imported events:', importedEvents.length);
            }
          } catch (error) {
            alert('Error importing events: Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <style>{`
        .custom-event {
          border-radius: 4px !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
        }
        .fc-event {
          border: none !important;
          border-radius: 4px !important;
        }
        .fc-event:hover {
          opacity: 0.8 !important;
          cursor: pointer !important;
        }
      `}</style>
      {/* Control Panel */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={addSampleEvents}
              className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              📅 Add Sample Events
            </button>
            <button
              onClick={exportEvents}
              className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
            >
              💾 Export Events
            </button>
            <button
              onClick={importEvents}
              className="px-3 py-2 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
            >
              📥 Import Events
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {events.length} event{events.length !== 1 ? 's' : ''} saved
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          editable={true}
          selectable={true}
          eventDrop={handleEventChange} // Drag & drop
          eventResize={handleEventChange} // Resize
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={true}
          eventDisplay="block"
          eventTextColor="white"
          eventBackgroundColor="#3788d8"
          eventBorderColor="#3788d8"
          eventClassNames={(info) => {
            return info.event.extendedProps.color ? 'custom-event' : '';
          }}
          eventContent={(info) => {
            return {
              html: `<div style="background-color: ${info.event.extendedProps.color || '#3788d8'}; color: white; padding: 2px 4px; border-radius: 3px; font-size: 12px;">${info.event.title}</div>`
            };
          }}
        />
      </div>

      {/* Instructions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          <p className="font-semibold mb-2">📋 How to use:</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Click on any date</strong> to create a new event</li>
            <li>• <strong>Click on an event</strong> to edit title, time, reminder, description, location, color, or delete</li>
            <li>• <strong>Drag events</strong> to reschedule them</li>
            <li>• <strong>Resize events</strong> to change duration</li>
            <li>• <strong>Switch views</strong> using the buttons above (Month/Week/Day)</li>
            <li>• <strong>Events are automatically saved</strong> and will persist across browser sessions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
