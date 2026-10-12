import React, { useState, useRef, useEffect } from 'react';
import DemographicsWidget from '../components/widgets/demographics';
import PatientStatsWidget from '../components/widgets/stats';
import TimelineSummaryWidget from '../components/widgets/timeline';
import CohortAnalyticsWidget from '../components/widgets/CohortAnalyticsWidget';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  status?: 'typing' | 'complete';
  layout?: any[];
  trace?: { method: string; endpoint: string; body: any }[];
  actions?: { id: string; label: string; icon: string; trace?: { method: string; endpoint: string; body: any }[] }[];
  widgetsLoading?: boolean;
}

interface WidgetDef {
  id: string;
  type: string;
  w: number;
  data: any;
}

const AgentView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'agent',
      content:
        'Hello Dr. Miller. I am your clinical research assistant. I can help you query the OMOP CDM, analyze patient cohorts, or summarize medical records. How can I assist you today?',
      timestamp: new Date(),
    },
    {
      id: '2',
      role: 'user',
      content: 'Summarize Person #18462',
      timestamp: new Date(),
    },
    {
      id: '3',
      role: 'agent',
      content: 'SUMMARY_18462',
      timestamp: new Date(),
      status: 'complete',
      trace: [
        { method: 'POST', endpoint: '/api/omop/person/search', body: { person_id: 18462, include_metadata: true } },
        { method: 'POST', endpoint: '/api/omop/condition_occurrence', body: { person_id: 18462, concept_ids: [4289422], status: 'active' } },
        { method: 'POST', endpoint: '/api/omop/measurement/latest', body: { person_id: 18462, limit: 5, sort: 'desc' } },
        { method: 'POST', endpoint: '/api/omop/drug_exposure', body: { person_id: 18462, active_only: true } },
      ]
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const T2DM_SEARCH_TRACE = [
    { 
      method: 'POST', 
      endpoint: '/api/omop/conditions_occurrence', 
      body: { 
        condition_concept_id: 201826,
        includeDescendants: true,
        count: true,
        distinctPatients: true
      } 
    }
  ];

  const SUMMARY_18462_TRACE = [
    { method: 'POST', endpoint: '/api/omop/person/search', body: { person_id: 18462, include_metadata: true } },
    { method: 'POST', endpoint: '/api/omop/condition_occurrence/search', body: { person_id: 18462, condition_concept_ids: [4289422], status: 'active' } },
    { method: 'POST', endpoint: '/api/omop/measurement/latest', body: { person_id: 18462, limit: 5, sort: 'desc' } },
    { method: 'POST', endpoint: '/api/omop/drug_exposure', body: { person_id: 18462} },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const getAgentResponse = (query: string): { text: string; layout?: any[]; trace?: any[]; actions?: any[] } => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('active cohort') || lowerQuery.includes('t2dm + hypertension')) {
      return {
        text:
          "The current active cohort 'T2DM + Hypertension' contains 850 patients. The inclusion criteria were: \n1. Condition occurrence of Type 2 Diabetes\n2. Condition occurrence of Essential Hypertension\n3. Age >= 45 at index date.",
      };
    } else if (lowerQuery.includes('18462')) {
      return {
        text: 'SUMMARY_18462',
        trace: SUMMARY_18462_TRACE,
      };
    } else if (lowerQuery.includes('t2dm') || lowerQuery.includes('diabetes')) {
      return {
        text: "I've found 1,240 patients matching the criteria for Type 2 Diabetes Mellitus (Concept ID: 201826) across the CDM.",
        trace: T2DM_SEARCH_TRACE,
        actions: [
          { 
            id: 'save', 
            label: 'Save as Cohort', 
            icon: 'save',
            trace: [{ method: 'POST', endpoint: '/api/omop/cohort', body: { name: 'T2DM Patients', criteria: { condition_concept_id: 201826 }, count: 1240 } }]
          },
          { id: 'create', label: 'Refine Query', icon: 'filter_list' },
          { id: 'visualize', label: 'Visualize', icon: 'analytics' },
          { id: 'export', label: 'Export Dataset', icon: 'download' }
        ]
      };
    } else if (lowerQuery.includes('visualize') || lowerQuery.includes('analytics')) {
      return {
        text: "I've compiled a comprehensive demographic and clinical overview for the Type 2 Diabetes Mellitus cohort (N=1,240). Here is the breakdown of age distribution, gender parity, and visit frequency trends.",
        layout: [
          {
            id: 'cohort-stats',
            type: 'stats',
            w: 12,
            data: {
              title: 'T2DM Cohort Highlights',
              stats: [
                { label: 'Total Size', value: '1,240', change: '+5.2%', trend: 'up' },
                { label: 'Avg HbA1c', value: '7.4%', change: '-0.3%', trend: 'down' },
                { label: 'Compliance', value: '82%', change: '+4%', trend: 'up' },
                { label: 'Active MRNs', value: '1,102', change: 'Stable', trend: 'neutral' },
              ]
            }
          },
          {
            id: 'age-dist',
            type: 'analytics',
            w: 6,
            data: {
              title: 'Age Distribution',
              type: 'age',
              items: [
                { name: '18-35', value: 120 },
                { name: '36-50', value: 450 },
                { name: '51-65', value: 540 },
                { name: '65+', value: 130 }
              ]
            }
          },
          {
            id: 'gender-dist',
            type: 'analytics',
            w: 6,
            data: {
              title: 'Gender Parity',
              type: 'gender',
              items: [
                { name: 'Female', value: 645 },
                { name: 'Male', value: 595 }
              ]
            }
          },
          {
            id: 'comorbidities',
            type: 'analytics',
            w: 12,
            data: {
              title: 'Top Comorbidities',
              type: 'conditions',
              items: [
                { name: 'Hypertension', value: 850 },
                { name: 'Hyperlipidemia', value: 720 },
                { name: 'CKD', value: 310 },
                { name: 'Obesity', value: 680 }
              ]
            }
          },
          {
            id: 'visit-timeline',
            type: 'timeline',
            w: 12,
            data: {
              events: [
                { date: 'Oct 2023', title: 'Cohort Indexed', description: 'Patients matching T2DM criteria added to research registry.' },
                { date: 'Jan 2024', title: 'Quality Audit', description: 'Standardized measurement protocols applied across 8 clinics.' },
                { date: 'Apr 2024', title: 'Latest Snapshot', description: 'Data refreshed from OMOP CDM v5.4 warehouse.' }
              ]
            }
          }
        ],
        actions: [
          { id: 'export', label: 'Export Detailed report', icon: 'description' },
          { id: 'compare', label: 'Compare with Hypertension cohort', icon: 'compare' }
        ]
      };
    } else if (lowerQuery.includes('summary') || lowerQuery.includes('patient') || lowerQuery.includes('sarah')) {
      return {
        text:
          "I have summarized Sarah Miller's profile (Person ID: 41285). \n\nKey finding: Recent lab results show elevated HbA1c (7.2%) which is a 0.4% increase from her previous baseline. Her current medication list includes Metformin 500mg BID and Lisinopril 10mg daily.",
        layout: [
          {
            id: 'summary-1',
            type: 'demographics',
            w: 12,
            data: {
              name: 'Sarah Miller',
              age: 64,
              gender: 'Female',
              mrn: 'MRN-84920-X',
              location: 'Boston, MA',
            },
          },
        ],
      };
    }

    return {
      text: "I've analyzed the OMOP CDM based on your request. Is there anything specific from the results you'd like me to focus on?",
    };
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate agent thinking
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const response = getAgentResponse(userMessage.content);
    const agentMsgId = (Date.now() + 1).toString();
    const agentMessage: Message = {
      id: agentMsgId,
      role: 'agent',
      content: response.text,
      timestamp: new Date(),
      status: 'complete',
      trace: response.trace,
      actions: (response as any).actions,
      widgetsLoading: !!response.layout,
    };

    setIsTyping(false);
    setMessages((prev) => [...prev, agentMessage]);

    if (response.layout) {
      // Simulate widget synthesis delay
      await new Promise((resolve) => setTimeout(resolve, 1800));
      setMessages((prev) => 
        prev.map((m) => 
          m.id === agentMsgId ? { ...m, layout: response.layout, widgetsLoading: false } : m
        )
      );
    }
  };

  const renderWidget = (widget: WidgetDef) => {
    switch (widget.type) {
      case 'demographics':
        return <DemographicsWidget title="Demographics" config={{}} isEditMode={false} />;
      case 'stats':
        return <PatientStatsWidget title="Patient Stats" config={{}} isEditMode={false} />;
      case 'timeline':
        return <TimelineSummaryWidget title="Visit Timeline" config={{}} isEditMode={false} />;
      case 'analytics':
        return <CohortAnalyticsWidget data={widget.data} />;
      default:
        return (
          <div className="p-4 text-slate-500 italic text-xs">
            Unknown widget type: {widget.type}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <span className="material-symbols-outlined">smart_toy</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">Clinical Assistant</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">
              Natural Language interface
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">
              OMOP CDM Linked
            </span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-4">
            {msg.role === 'user' ? (
              <div className="flex justify-end">
                <p className="bg-blue-500/15 border border-blue-500/30 text-slate-700 dark:text-slate-200 rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%] text-sm">
                  {msg.content}
                </p>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%] text-slate-700 dark:text-slate-200 text-sm space-y-2 shadow-sm">
                  {msg.content === 'SUMMARY_18462' ? (
                    <>
                      <p>
                        <span className="font-bold text-slate-900 dark:text-white">Person #18462</span> —
                        55-year-old male, last visit 2024-10-08.
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">
                        Active conditions: Type 2 DM, Essential Hypertension,
                        Hyperlipidemia. Vitals: BMI 28.4 (+1.2), BP 7.1% (-0.4).
                      </p>
                      <button 
                        onClick={() => setExpandedTraceId(expandedTraceId === msg.id ? null : msg.id)}
                        className="text-xs text-amber-600 dark:text-amber-400/90 hover:underline flex items-center gap-1 mt-1"
                      >
                        ▸ {expandedTraceId === msg.id ? 'Hide trace' : `Generated from ${msg.trace?.length || 0} OMOP queries · view trace`}
                      </button>

                      {expandedTraceId === msg.id && msg.trace && (
                        <div className="mt-3 space-y-2 border-t border-slate-100 dark:border-slate-700/50 pt-3">
                          {msg.trace.map((q, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700/30">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase">{q.method}</span>
                                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 tracking-tight">{q.endpoint}</span>
                                </div>
                                <span className="text-[9px] text-slate-400">API v1.2</span>
                              </div>
                              <code className="text-[10px] font-mono text-slate-500 dark:text-slate-400 whitespace-pre-wrap leading-relaxed bg-slate-100/50 dark:bg-slate-800/80 p-2 rounded mt-1 border border-slate-200/50 dark:border-slate-700/20">
                                {JSON.stringify(q.body, null, 2)}
                              </code>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {msg.content.split('\n').map((line, i) => (
                        <p key={i} className={i > 0 ? 'mt-2' : ''}>
                          {line}
                        </p>
                      ))}

                      {msg.trace && (
                        <div className="mt-2 text-right">
                          <button 
                            onClick={() => setExpandedTraceId(expandedTraceId === msg.id ? null : msg.id)}
                            className="text-xs text-amber-600 dark:text-amber-400/90 hover:underline flex items-center gap-1 mt-1 ml-auto"
                          >
                            ▸ {expandedTraceId === msg.id ? 'Hide trace' : `Generated from ${msg.trace?.length || 0} OMOP queries · view trace`}
                          </button>
                        </div>
                      )}

                      {msg.actions && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {msg.actions.map((action) => (
                            <button
                              key={action.id}
                              onClick={() => {
                                if (action.id === 'save') {
                                  setActiveActionId(activeActionId === `${msg.id}-${action.id}` ? null : `${msg.id}-${action.id}`);
                                } else {
                                  setInputValue(action.label);
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">{action.icon}</span>
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {activeActionId?.startsWith(msg.id) && (
                        <div className="mt-3 p-3 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Cohort Saved</span>
                          </div>
                          <div className="space-y-2">
                            {msg.actions?.find(a => `${msg.id}-${a.id}` === activeActionId)?.trace?.map((t, idx) => (
                              <div key={idx} className="bg-white/80 dark:bg-slate-900/80 rounded-lg p-2 border border-emerald-200 dark:border-emerald-800/20">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[8px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase">{t.method}</span>
                                  <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400">{t.endpoint}</span>
                                </div>
                                <pre className="text-[9px] font-mono text-slate-500 dark:text-slate-400 overflow-x-auto">
                                  {JSON.stringify(t.body, null, 2)}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {expandedTraceId === msg.id && msg.trace && (
                        <div className="mt-3 space-y-2 border-t border-slate-100 dark:border-slate-700/50 pt-3">
                          {msg.trace.map((q, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700/30">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase">{q.method}</span>
                                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 tracking-tight">{q.endpoint}</span>
                                </div>
                                <span className="text-[9px] text-slate-400">API v1.2</span>
                              </div>
                              <code className="text-[10px] font-mono text-slate-500 dark:text-slate-400 whitespace-pre-wrap leading-relaxed bg-slate-100/50 dark:bg-slate-800/80 p-2 rounded mt-1 border border-slate-200/50 dark:border-slate-700/20">
                                {JSON.stringify(q.body, null, 2)}
                              </code>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {msg.widgetsLoading && (
                    <div className="mt-4 p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse [animation-delay:200ms]"></div>
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse [animation-delay:400ms]"></div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                          Synthesizing clinical widgets...
                        </span>
                      </div>
                    </div>
                  )}

                  {msg.layout && (
                    <div className="mt-4 w-full grid grid-cols-12 gap-4">
                      {msg.layout.map((widget) => (
                        <div
                          key={widget.id}
                          className={`${
                            widget.w === 6 ? 'col-span-12 lg:col-span-6' : 'col-span-12 lg:col-span-12'
                          } h-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden`}
                        >
                          {renderWidget(widget)}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <span className="text-[10px] text-slate-400 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything about the OMOP dataset..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-indigo-500/20 shrink-0"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
        <div className="max-w-4xl mx-auto mt-4 flex flex-wrap gap-2 justify-center">
          {[
            'Summarize Person #18462',
            'How many active T2DM patients?',
            'Analyze visit trends last month',
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInputValue(suggestion)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:border-indigo-500/50 hover:text-indigo-500 transition-all bg-white dark:bg-slate-900 shadow-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentView;
