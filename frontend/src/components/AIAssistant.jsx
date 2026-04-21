// frontend/src/components/AIAssistant.jsx
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { askAI, generateExperiment } from '../services/ai';
import { DAILY_PROTOCOL } from '../data/dailyProtocol';

export default function AIAssistant() {
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  // Experiment generator state
  const [topic, setTopic] = useState('');
  const [book, setBook] = useState('');
  const [days, setDays] = useState(7);
  const [experimentOutput, setExperimentOutput] = useState(null);
  const [experiments, setExperiments] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ldt:experiments') || '[]'); } catch { return []; }
  });

  // Add state for expanded experiments
  const [expandedExperiment, setExpandedExperiment] = useState(null);

  useEffect(() => {
    localStorage.setItem('ldt:experiments', JSON.stringify(experiments));
  }, [experiments]);

  const handleAsk = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      // Gather Context
      const protein = localStorage.getItem('daily_protein') || '0';
      const streak = localStorage.getItem('integrity_streak') || '0';
      const workouts = JSON.parse(localStorage.getItem('ldt:workouts_log') || '[]');
      const lastRelapse = localStorage.getItem('integrity_last_relapse') || 'None';

      const todayMission = DAILY_PROTOCOL.workouts[new Date().getDay()];

      const context = {
        protein: parseInt(protein),
        streak: parseInt(streak),
        lastRelapse,
        todayMission,
        recentWorkouts: workouts.slice(-3) // Last 3 sessions
      };

      const text = await askAI(prompt, context);
      setReply(text);
    } catch (e) {
      setReply('AI error: ' + (e.message || e));
    } finally { setLoading(false); }
  };

  const handleGenerateExperiment = async () => {
    if (!topic.trim()) return alert('Enter a topic for the experiment');
    setLoading(true);
    setExperimentOutput(null);
    try {
      const out = await generateExperiment({ topic, book, durationDays: days });

      console.log('Response:', out); // Debug log

      // Check if it's the proper structured format from OpenAI
      if (out && typeof out === 'object' && out.summary && out.plan && Array.isArray(out.plan)) {
        // It's already in the correct format from the backend
        setExperimentOutput({ parsed: out });
      } else if (out && typeof out === 'object' && !Array.isArray(out)) {
        // Check for day-based format (day1, day2, etc.)
        const dayKeys = Object.keys(out).filter(key => key.startsWith('day'));

        if (dayKeys.length > 0) {
          // Convert day-based format to structured format
          const plan = dayKeys.sort().map((dayKey, index) => ({
            day: index + 1,
            goal: out[dayKey],
            actions: [out[dayKey]],
            measure: ""
          }));
          setExperimentOutput({ parsed: { summary: topic, plan } });
        } else {
          // It's an object but not in expected format
          setExperimentOutput({ raw: JSON.stringify(out, null, 2) });
        }
      } else if (typeof out === 'string') {
        // If somehow it's still a string, handle it
        setExperimentOutput({ raw: out });
      } else {
        // Fallback for any other format
        setExperimentOutput({ raw: JSON.stringify(out, null, 2) });
      }

    } catch (e) {
      console.error('Generation error:', e);
      setExperimentOutput({ raw: 'Generation failed: ' + (e.message || e) });
    } finally {
      setLoading(false);
    }
  };

  const saveExperiment = (exp) => {
    const item = {
      id: Date.now(),
      topic,
      book,
      days,
      createdAt: new Date().toISOString(),
      value: exp
    };
    setExperiments([item, ...experiments]);
    alert('Experiment saved');
  };

  // Add new helper functions
  const deleteExperiment = (id) => {
    if (confirm('Are you sure you want to delete this experiment?')) {
      setExperiments(experiments.filter(exp => exp.id !== id));
      alert('Experiment deleted');
    }
  };

  const exportExperiment = (exp) => {
    const dataStr = JSON.stringify(exp, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `experiment-${exp.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow">
      <h2 className="text-lg font-semibold mb-3">🤖 AI Assistant</h2>

      <div className="mb-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a question to the AI (e.g., 'Summarize my week and suggest one improvement')"
          className="w-full p-3 border rounded"
          rows={3}
        />
        <div className="flex gap-2 mt-2">
          <button onClick={handleAsk} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded">
            {loading ? 'Thinking...' : 'Ask AI'}
          </button>
        </div>
        {reply && (
          <div className="mt-3 p-4 bg-slate-50 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs text-gray-500 font-medium">🤖 AI Response:</div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(reply);
                  alert('Response copied to clipboard!');
                }}
                className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-600"
              >
                📋 Copy
              </button>
            </div>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom styling for markdown elements
                  h1: ({ children }) => <h1 className="text-lg font-bold text-gray-800 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold text-gray-800 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold text-gray-800 mb-1">{children}</h3>,
                  p: ({ children }) => <p className="text-sm text-gray-700 mb-2 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside text-sm text-gray-700 mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside text-sm text-gray-700 mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm text-gray-700">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                  em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                  code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono text-gray-800">{children}</code>,
                  pre: ({ children }) => <pre className="bg-gray-200 p-2 rounded text-xs font-mono text-gray-800 overflow-x-auto">{children}</pre>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-indigo-300 pl-3 italic text-gray-600 my-2">{children}</blockquote>,
                  a: ({ children, href }) => <a href={href} className="text-indigo-600 hover:text-indigo-800 underline text-sm" target="_blank" rel="noopener noreferrer">{children}</a>,
                  table: ({ children }) => <table className="min-w-full text-xs border-collapse border border-gray-300 my-2">{children}</table>,
                  th: ({ children }) => <th className="border border-gray-300 bg-gray-100 px-2 py-1 font-semibold text-left">{children}</th>,
                  td: ({ children }) => <td className="border border-gray-300 px-2 py-1">{children}</td>,
                }}
              >
                {reply}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      <hr className="my-4" />

      <div>
        <h3 className="font-semibold mb-2">🧪 Generate a {days}-day experiment</h3>
        <input className="w-full border p-2 rounded mb-2" placeholder="Topic (e.g. 'Deep work routine')" value={topic} onChange={e => setTopic(e.target.value)} />
        <input className="w-full border p-2 rounded mb-2" placeholder="Optional book / source (e.g. 'Dopamine Detox')" value={book} onChange={e => setBook(e.target.value)} />
        <div className="flex gap-2 items-center mb-3">
          <label className="text-sm">Days:</label>
          <input type="number" min="1" max="30" value={days} onChange={e => setDays(Number(e.target.value))} className="w-20 border p-2 rounded" />
          <button onClick={handleGenerateExperiment} disabled={loading} className="px-3 py-2 bg-emerald-500 text-white rounded">
            {loading ? 'Generating...' : `Generate ${days}-day Plan`}
          </button>
        </div>

        {experimentOutput && (
          <div className="bg-slate-50 p-4 rounded-lg">
            {/* If parsed structured format */}
            {experimentOutput.parsed ? (
              <>
                <div className="mb-4">
                  <h4 className="font-semibold text-lg mb-2">📋 Experiment Summary</h4>
                  <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                    {experimentOutput.parsed.summary}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-lg mb-3">📅 Daily Plan</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 bg-white rounded-lg shadow-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 w-16">Day</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Goal</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Success Measure</th>
                        </tr>
                      </thead>
                      <tbody>
                        {experimentOutput.parsed.plan.map((dayPlan, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-300 px-4 py-3 text-center font-medium text-indigo-600">
                              {dayPlan.day}
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <div className="font-medium text-gray-900">{dayPlan.goal}</div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <ul className="space-y-1">
                                {dayPlan.actions?.map((action, actionIndex) => (
                                  <li key={actionIndex} className="flex items-start">
                                    <span className="text-green-500 mr-2 mt-1">•</span>
                                    <span className="text-gray-700">{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <div className="text-gray-600 italic">
                                {dayPlan.measure || 'No specific measure defined'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => saveExperiment(experimentOutput.parsed)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    💾 Save Experiment
                  </button>
                  <button
                    onClick={() => {
                      const tableData = experimentOutput.parsed.plan.map(p =>
                        `Day ${p.day}: ${p.goal}\nActions: ${p.actions.join(', ')}\nMeasure: ${p.measure}`
                      ).join('\n\n');
                      navigator.clipboard.writeText(`${experimentOutput.parsed.summary}\n\n${tableData}`);
                      alert('Copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    📋 Copy to Clipboard
                  </button>
                </div>
              </>
            ) : (
              // Fallback: raw text
              <>
                <div className="font-medium mb-2">Raw Output</div>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs text-gray-500 font-medium">🤖 Raw AI Response:</div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(experimentOutput.raw);
                        alert('Raw response copied to clipboard!');
                      }}
                      className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-600"
                    >
                      📋 Copy
                    </button>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-lg font-bold text-gray-800 mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold text-gray-800 mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-bold text-gray-800 mb-1">{children}</h3>,
                        p: ({ children }) => <p className="text-sm text-gray-700 mb-2 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside text-sm text-gray-700 mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside text-sm text-gray-700 mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-sm text-gray-700">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                        em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                        code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono text-gray-800">{children}</code>,
                        pre: ({ children }) => <pre className="bg-gray-200 p-2 rounded text-xs font-mono text-gray-800 overflow-x-auto">{children}</pre>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-indigo-300 pl-3 italic text-gray-600 my-2">{children}</blockquote>,
                        a: ({ children, href }) => <a href={href} className="text-indigo-600 hover:text-indigo-800 underline text-sm" target="_blank" rel="noopener noreferrer">{children}</a>,
                      }}
                    >
                      {experimentOutput.raw}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => saveExperiment(experimentOutput)}
                    className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Save Raw
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <hr className="my-4" />

      {/* Enhanced Saved Experiments Section */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center">
          💾 Saved Experiments ({experiments.length})
        </h3>

        {experiments.length === 0 && (
          <div className="text-sm text-slate-500 p-4 text-center border-2 border-dashed rounded-lg">
            No saved experiments yet. Generate and save your first experiment above!
          </div>
        )}

        <div className="space-y-3">
          {experiments.map(exp => (
            <div key={exp.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
              {/* Header */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{exp.topic}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      {exp.days} days • {exp.book && `Based on "${exp.book}" • `}
                      Created: {new Date(exp.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setExpandedExperiment(expandedExperiment === exp.id ? null : exp.id)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                      {expandedExperiment === exp.id ? '▲ Hide' : '▼ View'}
                    </button>
                    <button
                      onClick={() => exportExperiment(exp)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                      title="Export as JSON file"
                    >
                      📁 Export
                    </button>
                    <button
                      onClick={() => deleteExperiment(exp.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                      title="Delete experiment"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedExperiment === exp.id && (
                <div className="p-4">
                  {exp.value?.summary && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2">Summary:</h5>
                      <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                        {exp.value.summary}
                      </div>
                    </div>
                  )}

                  {exp.value?.plan && Array.isArray(exp.value.plan) && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Plan:</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 rounded">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Day</th>
                              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Goal</th>
                              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Actions</th>
                              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Measure</th>
                            </tr>
                          </thead>
                          <tbody>
                            {exp.value.plan.map((dayPlan, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="border border-gray-300 px-3 py-2 text-center font-medium text-indigo-600">
                                  {dayPlan.day}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-sm">
                                  {dayPlan.goal}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-sm">
                                  <ul className="space-y-1">
                                    {dayPlan.actions?.map((action, actionIndex) => (
                                      <li key={actionIndex} className="flex items-start">
                                        <span className="text-green-500 mr-1">•</span>
                                        <span>{action}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-sm text-gray-600 italic">
                                  {dayPlan.measure || 'No measure defined'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Copy button for individual experiments */}
                  <div className="mt-4 pt-3 border-t">
                    <button
                      onClick={() => {
                        const content = exp.value?.plan ?
                          `${exp.value.summary}\n\n${exp.value.plan.map(p =>
                            `Day ${p.day}: ${p.goal}\nActions: ${p.actions?.join(', ')}\nMeasure: ${p.measure}`
                          ).join('\n\n')}` :
                          JSON.stringify(exp.value, null, 2);
                        navigator.clipboard.writeText(content);
                        alert('Experiment copied to clipboard!');
                      }}
                      className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded text-sm hover:bg-indigo-200"
                    >
                      📋 Copy This Experiment
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}