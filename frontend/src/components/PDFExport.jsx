import React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function ExportPDF({ habits }) {
  const handleExport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Habit Tracker Report", 14, 20);

    const head = [["Habit", "Completed Days"]];
    const body = habits.map(h => [h.name, (h.completedDays || []).length.toString()]);

    doc.autoTable({
      head,
      body,
      startY: 30,
      styles: { fontSize: 11 },
    });

    doc.save("habit-tracker.pdf");
  };

  return (
    <button onClick={handleExport} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
      📄 Export to PDF
    </button>
  );
}
