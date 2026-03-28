/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ReactNode, useMemo, KeyboardEvent, useEffect, ChangeEvent, useRef } from 'react';
import { LayoutDashboard, NotebookPen, Settings, Plus, CheckCircle2, Circle, Clock, ChevronRight, Bell, Moon, User, Shield, Calendar as CalendarIcon, ChevronLeft, X, Tag, Folder, AlertCircle, Timer, Play, Pause, RotateCcw, Sparkles, Send, Bot, User as UserIcon, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

type Section = 'dashboard' | 'calendar' | 'notes' | 'settings';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  date: string; // YYYY-MM-DD
  time?: string;
  category: string;
  tags: string[];
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  location?: string;
  category: string;
  tags: string[];
}

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
  color?: string;
}

const CATEGORIES = ['General', 'Work', 'Personal', 'Health', 'Finance', 'Shopping'];
const PRIORITIES = ['low', 'medium', 'high'] as const;

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Review project proposal', description: 'Read through the latest draft and leave comments on the budget section.', completed: false, priority: 'high', date: '2026-03-27', time: '10:00 AM', category: 'Work', tags: ['urgent', 'planning'] },
    { id: '2', title: 'Buy groceries', completed: true, priority: 'medium', date: '2026-03-27', category: 'Shopping', tags: ['home'] },
    { id: '3', title: 'Call the bank', completed: false, priority: 'low', date: '2026-03-27', time: '2:30 PM', category: 'Finance', tags: ['admin'] },
    { id: '4', title: 'Gym session', completed: false, priority: 'medium', date: '2026-03-27', time: '6:00 PM', category: 'Health', tags: ['fitness'] },
  ]);
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: '1', title: 'Design Sync', description: 'Weekly sync with the design team.', date: '2026-03-27', startTime: '11:00', endTime: '12:00', category: 'Work', tags: ['design', 'sync'] },
    { id: '2', title: 'Lunch with Sarah', date: '2026-03-27', startTime: '13:00', endTime: '14:00', category: 'Personal', tags: ['social'] },
  ]);
  const [notes, setNotes] = useState<Note[]>([
    { id: '1', title: 'Project Ideas', content: 'Explore new design recipes for the dashboard...', date: '2h ago', tags: ['work', 'design'], color: 'bg-blue-50' },
    { id: '2', title: 'Shopping List', content: 'Milk, Eggs, Bread, Coffee beans, Avocados...', date: 'Yesterday', tags: ['personal'], color: 'bg-amber-50' },
    { id: '3', title: 'Meeting Notes', content: 'Discussed the Q3 roadmap and budget allocation...', date: 'Mar 25', tags: ['work'], color: 'bg-emerald-50' },
  ]);
  const [isTaskCreatorOpen, setIsTaskCreatorOpen] = useState(false);
  const [isEventCreatorOpen, setIsEventCreatorOpen] = useState(false);
  const [isNoteCreatorOpen, setIsNoteCreatorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  const addTask = (newTask: Omit<Task, 'id' | 'completed'>) => {
    const task: Task = {
      ...newTask,
      id: Math.random().toString(36).substr(2, 9),
      completed: false,
    };
    setTasks([task, ...tasks]);
    setIsTaskCreatorOpen(false);
  };

  const addEvent = (newEvent: Omit<CalendarEvent, 'id'>) => {
    const event: CalendarEvent = {
      ...newEvent,
      id: Math.random().toString(36).substr(2, 9),
    };
    setEvents([event, ...events]);
    setIsEventCreatorOpen(false);
  };

  const addNote = (newNote: Omit<Note, 'id' | 'date'>) => {
    const note: Note = {
      ...newNote,
      id: Math.random().toString(36).substr(2, 9),
      date: 'Just now',
    };
    setNotes([note, ...notes]);
    setIsNoteCreatorOpen(false);
  };

  const updateNote = (updatedNote: Note) => {
    setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
    setEditingNote(null);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    setEditingNote(null);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard tasks={tasks} onToggle={toggleTask} onOpenAI={() => setIsAIAssistantOpen(true)} />;
      case 'calendar':
        return <Calendar tasks={tasks} events={events} />;
      case 'notes':
        return (
          <Notes 
            notes={notes} 
            onAdd={() => setIsNoteCreatorOpen(true)} 
            onEdit={(note) => setEditingNote(note)} 
          />
        );
      case 'settings':
        return <SettingsSection />;
      default:
        return <Dashboard tasks={tasks} onToggle={toggleTask} onOpenAI={() => setIsAIAssistantOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-bold tracking-tight capitalize">
            {activeSection === 'dashboard' ? 'My Day' : activeSection}
          </h1>
          <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden">
            <User className="w-5 h-5 text-neutral-500" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 py-3 pb-safe">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          <NavButton 
            active={activeSection === 'dashboard'} 
            onClick={() => setActiveSection('dashboard')}
            icon={<LayoutDashboard className="w-6 h-6" />}
            label="Home"
          />
          <NavButton 
            active={activeSection === 'calendar'} 
            onClick={() => setActiveSection('calendar')}
            icon={<CalendarIcon className="w-6 h-6" />}
            label="Calendar"
          />
          <NavButton 
            active={activeSection === 'notes'} 
            onClick={() => setActiveSection('notes')}
            icon={<NotebookPen className="w-6 h-6" />}
            label="Notes"
          />
          <NavButton 
            active={activeSection === 'settings'} 
            onClick={() => setActiveSection('settings')}
            icon={<Settings className="w-6 h-6" />}
            label="Settings"
          />
        </div>
      </nav>

      {/* Floating Action Button */}
      {activeSection !== 'settings' && (
        <div className="fixed bottom-24 right-6 flex flex-col items-end gap-3 z-20">
          <AnimatePresence>
            {isFabMenuOpen && (
              <>
                <motion.button
                  initial={{ opacity: 0, scale: 0.5, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 30 }}
                  onClick={() => {
                    setIsTimerOpen(true);
                    setIsFabMenuOpen(false);
                  }}
                  className="flex items-center gap-2 bg-white border border-neutral-200 px-4 py-2 rounded-full shadow-lg text-sm font-bold active:scale-95 transition-transform"
                >
                  <Timer className="w-4 h-4" /> Focus
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 20 }}
                  onClick={() => {
                    setIsEventCreatorOpen(true);
                    setIsFabMenuOpen(false);
                  }}
                  className="flex items-center gap-2 bg-white border border-neutral-200 px-4 py-2 rounded-full shadow-lg text-sm font-bold active:scale-95 transition-transform"
                >
                  <CalendarIcon className="w-4 h-4" /> Event
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 10 }}
                  onClick={() => {
                    setIsTaskCreatorOpen(true);
                    setIsFabMenuOpen(false);
                  }}
                  className="flex items-center gap-2 bg-white border border-neutral-200 px-4 py-2 rounded-full shadow-lg text-sm font-bold active:scale-95 transition-transform"
                >
                  <CheckCircle2 className="w-4 h-4" /> Task
                </motion.button>
              </>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
            className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 ${isFabMenuOpen ? 'bg-neutral-200 text-neutral-900 rotate-45' : 'bg-neutral-900 text-white'}`}
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isTaskCreatorOpen && (
          <TaskCreator 
            onClose={() => setIsTaskCreatorOpen(false)} 
            onSave={addTask} 
          />
        )}
        {isEventCreatorOpen && (
          <EventCreator 
            onClose={() => setIsEventCreatorOpen(false)} 
            onSave={addEvent} 
          />
        )}
        {isTimerOpen && (
          <FocusTimer 
            onClose={() => setIsTimerOpen(false)} 
          />
        )}
        {isAIAssistantOpen && (
          <AIAssistant 
            onClose={() => setIsAIAssistantOpen(false)}
            onAddTask={addTask}
            onAddEvent={addEvent}
            onAddNote={addNote}
          />
        )}
        {(isNoteCreatorOpen || editingNote) && (
          <NoteCreator 
            note={editingNote || undefined}
            onClose={() => {
              setIsNoteCreatorOpen(false);
              setEditingNote(null);
            }} 
            onSave={(noteData) => {
              if (editingNote) {
                updateNote({ ...editingNote, ...noteData });
              } else {
                addNote(noteData);
              }
            }}
            onDelete={editingNote ? () => deleteNote(editingNote.id) : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AIAssistant({ onClose, onAddTask, onAddEvent, onAddNote }: { 
  onClose: () => void; 
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onAddNote: (note: Omit<Note, 'id' | 'date'>) => void;
}) {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: "Hi! I'm your personal organizer assistant. I can help you create tasks, events, and notes. Just tell me what you need!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const addTaskTool: FunctionDeclaration = {
        name: "addTask",
        description: "Add a new task to the to-do list.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The title of the task." },
            description: { type: Type.STRING, description: "Additional details about the task." },
            priority: { type: Type.STRING, enum: ["low", "medium", "high"], description: "The priority level." },
            category: { type: Type.STRING, description: "The category of the task (e.g., Work, Personal, Shopping)." },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of tags for the task." },
            date: { type: Type.STRING, description: "The date for the task in YYYY-MM-DD format." },
            time: { type: Type.STRING, description: "The time for the task (e.g., '10:00 AM')." }
          },
          required: ["title", "date"]
        }
      };

      const addEventTool: FunctionDeclaration = {
        name: "addEvent",
        description: "Add a new event to the calendar.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The title of the event." },
            description: { type: Type.STRING, description: "Additional details about the event." },
            date: { type: Type.STRING, description: "The date of the event in YYYY-MM-DD format." },
            startTime: { type: Type.STRING, description: "The start time in HH:MM format." },
            endTime: { type: Type.STRING, description: "The end time in HH:MM format." },
            location: { type: Type.STRING, description: "The location of the event." },
            category: { type: Type.STRING, description: "The category of the event." },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of tags for the event." }
          },
          required: ["title", "date", "startTime", "endTime"]
        }
      };

      const addNoteTool: FunctionDeclaration = {
        name: "addNote",
        description: "Add a new quick note.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The title of the note." },
            content: { type: Type.STRING, description: "The content of the note." },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of tags for the note." },
            color: { type: Type.STRING, description: "A background color class for the note (e.g., bg-blue-50, bg-rose-50, bg-amber-50)." }
          },
          required: ["title", "content"]
        }
      };

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })).concat([{ role: 'user', parts: [{ text: userMessage }] }]),
        config: {
          systemInstruction: `You are a helpful personal organizer assistant. Use the provided tools to create tasks, events, and notes based on user requests. 
          The current date is Friday, March 27, 2026. 
          If a user request is ambiguous, ask for clarification. 
          When you successfully use a tool, confirm it to the user in a friendly way. 
          Always ensure you provide a date in YYYY-MM-DD format for tasks and events.`,
          tools: [{ functionDeclarations: [addTaskTool, addEventTool, addNoteTool] }]
        }
      });

      const functionCalls = response.functionCalls;
      let modelText = response.text || "";

      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === "addTask") {
            const args = call.args as any;
            onAddTask({
              title: args.title,
              description: args.description || "",
              priority: args.priority || "medium",
              category: args.category || "General",
              tags: args.tags || [],
              date: args.date || '2026-03-27',
              time: args.time
            });
            modelText += `\n\n[Task Created: ${args.title} for ${args.date || 'today'}]`;
          } else if (call.name === "addEvent") {
            const args = call.args as any;
            onAddEvent({
              title: args.title,
              description: args.description || "",
              date: args.date,
              startTime: args.startTime,
              endTime: args.endTime,
              location: args.location,
              category: args.category || "General",
              tags: args.tags || []
            });
            modelText += `\n\n[Event Created: ${args.title}]`;
          } else if (call.name === "addNote") {
            const args = call.args as any;
            onAddNote({
              title: args.title,
              content: args.content,
              tags: args.tags || [],
              color: args.color || 'bg-white'
            });
            modelText += `\n\n[Note Created: ${args.title}]`;
          }
        }
      }

      if (modelText) {
        setMessages(prev => [...prev, { role: 'model', text: modelText.trim() }]);
      }

    } catch (error) {
      console.error("AI Assistant Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-6"
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col h-[80vh] sm:h-[600px] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold">AI Assistant</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Powered by Gemini</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 text-white/60 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Messages */}
        <div 
          ref={scrollRef}
          className="flex-grow overflow-y-auto p-6 space-y-4 bg-neutral-50"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-500'}`}>
                  {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-neutral-900 text-white rounded-tr-none' : 'bg-white border border-neutral-200 text-neutral-700 rounded-tl-none shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-neutral-200 text-neutral-500 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-neutral-200 text-neutral-400 rounded-tl-none shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-medium">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-neutral-100">
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder="Ask me to create a task or event..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full bg-neutral-100 border-none rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:ring-2 focus:ring-neutral-200 transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 w-10 h-10 bg-neutral-900 text-white rounded-xl flex items-center justify-center active:scale-95 disabled:opacity-50 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-neutral-900' : 'text-neutral-400'}`}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}

function TaskCreator({ onClose, onSave }: { onClose: () => void; onSave: (task: Omit<Task, 'id' | 'completed'>) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [category, setCategory] = useState('General');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [date, setDate] = useState('2026-03-27');
  const [time, setTime] = useState('');

  const handleAddTag = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title,
      description,
      priority,
      category,
      tags,
      date,
      time: time || undefined
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-6"
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">New Task</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-neutral-100 text-neutral-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Task Title</label>
            <input 
              autoFocus
              type="text" 
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-medium border-none focus:ring-0 p-0 placeholder:text-neutral-300"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Description</label>
            <textarea 
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-neutral-600 border-none focus:ring-0 p-0 placeholder:text-neutral-300 resize-none min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                <Folder className="w-3 h-3" /> Category
              </label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-neutral-200"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Priority
              </label>
              <div className="flex gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all
                      ${priority === p ? 'bg-neutral-900 border-neutral-900 text-white shadow-md' : 'bg-white border-neutral-200 text-neutral-400'}
                    `}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" /> Date
              </label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-neutral-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-neutral-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Time
              </label>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-neutral-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-neutral-200"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags
            </label>
            <input 
              type="text" 
              placeholder="Press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full bg-neutral-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-neutral-200"
            />
          </div>

          {/* Tag Chips */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">
                  #{tag}
                  <button onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}

          <button 
            onClick={handleSave}
            disabled={!title.trim()}
            className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-bold shadow-xl active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all mt-4"
          >
            Create Task
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FocusTimer({ onClose }: { onClose: () => void }) {
  const presets = {
    work: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
  };

  const [mode, setMode] = useState<'work' | 'short' | 'long'>('work');
  const [duration, setDuration] = useState(presets.work);
  const [timeLeft, setTimeLeft] = useState(presets.work);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus Session Complete!', {
          body: mode === 'work' ? 'Time for a break!' : 'Ready to focus again?',
        });
      } else {
        alert('Focus Session Complete!');
      }
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(duration);
  };

  const switchMode = (newMode: 'work' | 'short' | 'long') => {
    setMode(newMode);
    setIsActive(false);
    setDuration(presets[newMode]);
    setTimeLeft(presets[newMode]);
  };

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const mins = parseInt(e.target.value);
    const newDuration = mins * 60;
    setDuration(newDuration);
    if (!isActive) {
      setTimeLeft(newDuration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / duration) * 100;

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-6"
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Timer className="w-6 h-6" /> Focus Timer
          </h2>
          <button onClick={onClose} className="p-2 rounded-full bg-neutral-100 text-neutral-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col items-center space-y-8">
          {/* Mode Selector */}
          <div className="flex bg-neutral-100 p-1 rounded-2xl w-full">
            {(['work', 'short', 'long'] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all
                  ${mode === m ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400'}
                `}
              >
                {m === 'work' ? 'Focus' : m === 'short' ? 'Short' : 'Long'}
              </button>
            ))}
          </div>

          {/* Timer Circle */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-neutral-100"
              />
              <motion.circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 120}
                initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
                animate={{ strokeDashoffset: (2 * Math.PI * 120) * (1 - progress / 100) }}
                className="text-neutral-900"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-6xl font-black tracking-tighter tabular-nums">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 mt-2">
                {mode === 'work' ? 'Stay Focused' : 'Take a Break'}
              </span>
            </div>
          </div>

          {/* Customization Slider */}
          <div className="w-full space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Adjust Duration</label>
              <span className="text-xs font-bold text-neutral-900">{Math.floor(duration / 60)} min</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="60" 
              value={Math.floor(duration / 60)} 
              onChange={handleSliderChange}
              className="w-full h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-neutral-900"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6 w-full">
            <button 
              onClick={resetTimer}
              className="flex-1 py-4 bg-neutral-100 text-neutral-600 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <RotateCcw className="w-5 h-5" /> Reset
            </button>
            <button 
              onClick={toggleTimer}
              className={`flex-[2] py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all
                ${isActive ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-neutral-900 text-white'}
              `}
            >
              {isActive ? (
                <><Pause className="w-5 h-5" /> Pause</>
              ) : (
                <><Play className="w-5 h-5" /> Start Session</>
              )}
            </button>
          </div>

          <p className="text-neutral-400 text-[10px] font-medium uppercase tracking-widest text-center">
            Notifications are enabled to alert you when the session ends.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EventCreator({ onClose, onSave }: { onClose: () => void; onSave: (event: Omit<CalendarEvent, 'id'>) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('2026-03-27');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState('General');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState('');

  const handleAddTag = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title,
      description,
      date,
      startTime,
      endTime,
      category,
      tags,
      location: location || undefined
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-6"
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">New Event</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-neutral-100 text-neutral-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Event Title</label>
            <input 
              autoFocus
              type="text" 
              placeholder="What's happening?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-medium border-none focus:ring-0 p-0 placeholder:text-neutral-300"
            />
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" /> Date
              </label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-neutral-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-neutral-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Location
              </label>
              <input 
                type="text" 
                placeholder="Where?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-neutral-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-neutral-200"
              />
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Start Time
              </label>
              <input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-neutral-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-neutral-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> End Time
              </label>
              <input 
                type="time" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-neutral-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-neutral-200"
              />
            </div>
          </div>

          {/* Category & Tags */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                <Folder className="w-3 h-3" /> Category
              </label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-neutral-200"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tags
              </label>
              <input 
                type="text" 
                placeholder="Press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full bg-neutral-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-neutral-200"
              />
            </div>
          </div>

          {/* Tag Chips */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">
                  #{tag}
                  <button onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}

          <button 
            onClick={handleSave}
            disabled={!title.trim()}
            className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-bold shadow-xl active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all mt-4"
          >
            Create Event
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Dashboard({ tasks, onToggle, onOpenAI }: { tasks: Task[]; onToggle: (id: string) => void; onOpenAI: () => void }) {
  const stats = useMemo(() => {
    const done = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const score = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, score };
  }, [tasks]);

  return (
    <div className="space-y-8">
      {/* Welcome & Stats */}
      <section>
        <p className="text-neutral-500 text-sm mb-1">Friday, March 27</p>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Hello, User</h2>
          <button 
            onClick={onOpenAI}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-full text-sm font-bold shadow-lg active:scale-95 transition-transform"
          >
            <Sparkles className="w-4 h-4" /> AI Assistant
          </button>
        </div>
        
        {/* AI Widget */}
        <div 
          onClick={onOpenAI}
          className="bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 rounded-[32px] text-white mb-8 shadow-xl cursor-pointer group overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Sparkles className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-widest">Powered by Gemini</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Need a hand?</h3>
            <p className="text-white/60 text-sm leading-relaxed max-w-[240px]">
              "Add a meeting tomorrow at 2pm" or "Create a shopping list for dinner".
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
            <p className="text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-1">Tasks Done</p>
            <p className="text-2xl font-bold">{stats.done}/{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
            <p className="text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-1">Focus Score</p>
            <p className={`text-2xl font-bold ${stats.score > 70 ? 'text-emerald-600' : 'text-amber-600'}`}>{stats.score}%</p>
          </div>
        </div>
      </section>

      {/* Tasks List */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Today's Tasks</h3>
          <button className="text-neutral-500 text-sm font-medium">View All</button>
        </div>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${task.completed ? 'bg-neutral-50 border-neutral-100 opacity-60' : 'bg-white border-neutral-200 shadow-sm'}`}
            >
              <button onClick={() => onToggle(task.id)} className="mt-1 flex-shrink-0">
                {task.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <Circle className="w-6 h-6 text-neutral-300" />
                )}
              </button>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`font-bold truncate ${task.completed ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
                    {task.title}
                  </p>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                    {task.category}
                  </span>
                </div>
                {task.description && !task.completed && (
                  <p className="text-neutral-500 text-xs line-clamp-1 mb-2">{task.description}</p>
                )}
                <div className="flex items-center gap-3">
                  {task.time && (
                    <div className="flex items-center gap-1 text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      <span>{task.time}</span>
                    </div>
                  )}
                  {task.tags.length > 0 && (
                    <div className="flex gap-1.5">
                      {task.tags.map(tag => (
                        <span key={tag} className="text-neutral-400 text-[10px] font-medium italic">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                task.priority === 'high' ? 'bg-rose-500' : 
                task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
              }`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Calendar({ tasks, events }: { tasks: Task[]; events: CalendarEvent[] }) {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const currentMonth = 'March 2026';
  const [selectedDay, setSelectedDay] = useState(27);
  
  const selectedDateStr = useMemo(() => {
    return `2026-03-${selectedDay.toString().padStart(2, '0')}`;
  }, [selectedDay]);
  
  // Mock calendar days for March 2026 (starting Sunday Mar 1)
  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);

  // Filter tasks and events for the selected day
  const dayTasks = tasks.filter(t => t.date === selectedDateStr && !t.completed);
  const dayEvents = events.filter(e => e.date === selectedDateStr);

  const formattedDate = useMemo(() => {
    const date = new Date(2026, 2, selectedDay);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [selectedDay]);

  return (
    <div className="space-y-8">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{currentMonth}</h2>
        <div className="flex gap-2">
          <button className="p-2 rounded-xl bg-white border border-neutral-200 shadow-sm active:scale-95 transition-transform">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-xl bg-white border border-neutral-200 shadow-sm active:scale-95 transition-transform">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
        <div className="grid grid-cols-7 gap-y-4 mb-4">
          {days.map((day, idx) => (
            <div key={idx} className="text-center text-xs font-bold text-neutral-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
          {calendarDays.map((day) => {
            const dateStr = `2026-03-${day.toString().padStart(2, '0')}`;
            const hasEvents = events.some(e => e.date === dateStr);
            const hasTasks = tasks.some(t => t.date === dateStr && !t.completed);
            
            return (
              <div key={day} className="flex justify-center items-center relative">
                <button 
                  onClick={() => setSelectedDay(day)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${day === selectedDay ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-700 hover:bg-neutral-50'}
                  `}
                >
                  {day}
                </button>
                {/* Event indicators */}
                {(hasEvents || hasTasks) && day !== selectedDay && (
                  <div className={`absolute bottom-1 w-1 h-1 rounded-full ${hasEvents ? 'bg-neutral-900' : 'bg-neutral-300'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule for Selected Day */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Schedule</h3>
          <span className="text-neutral-400 text-sm font-medium">{formattedDate}</span>
        </div>
        <div className="space-y-3">
          {/* Events First */}
          {dayEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-4 p-4 bg-neutral-900 text-white rounded-2xl shadow-md">
              <div className="w-1 h-10 rounded-full bg-white/20" />
              <div className="flex-grow">
                <h4 className="font-bold">{event.title}</h4>
                <p className="text-white/60 text-xs font-medium">{event.startTime} - {event.endTime}</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded bg-white/10 text-[8px] font-bold uppercase tracking-widest">
                  Event
                </span>
                {event.location && (
                  <p className="text-[10px] text-white/40 mt-1">{event.location}</p>
                )}
              </div>
            </div>
          ))}

          {/* Tasks Second */}
          {dayTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm">
              <div className={`w-1 h-10 rounded-full ${task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
              <div className="flex-grow">
                <h4 className="font-bold text-neutral-900">{task.title}</h4>
                <p className="text-neutral-400 text-xs font-medium">{task.time || 'All Day'}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-50 text-neutral-500`}>
                {task.category}
              </span>
            </div>
          ))}

          {dayEvents.length === 0 && dayTasks.length === 0 && (
            <div className="text-center py-8 text-neutral-400 italic text-sm">No events or tasks scheduled for today.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function Notes({ notes, onAdd, onEdit }: { notes: Note[]; onAdd: () => void; onEdit: (note: Note) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(n => 
      n.title.toLowerCase().includes(query) || 
      n.content.toLowerCase().includes(query) ||
      n.tags.some(t => t.toLowerCase().includes(query))
    );
  }, [notes, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quick Notes</h2>
        <button 
          onClick={onAdd}
          className="p-2 rounded-xl bg-neutral-900 text-white shadow-lg active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input 
          type="text" 
          placeholder="Search notes or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-neutral-200 rounded-2xl py-3 pl-4 pr-10 text-sm focus:ring-2 focus:ring-neutral-200 transition-all shadow-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
          <Tag className="w-4 h-4" />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <div 
              key={note.id} 
              onClick={() => onEdit(note)}
              className={`p-5 rounded-3xl border border-neutral-200 shadow-sm active:scale-[0.98] transition-all cursor-pointer hover:shadow-md ${note.color || 'bg-white'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-lg text-neutral-900">{note.title}</h4>
                <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">{note.date}</span>
              </div>
              <p className="text-neutral-600 text-sm line-clamp-3 leading-relaxed mb-4">
                {note.content}
              </p>
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {note.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-black/5 text-neutral-500 rounded text-[10px] font-bold uppercase tracking-wider">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-neutral-200">
            <NotebookPen className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
            <p className="text-neutral-400 text-sm italic">No notes found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NoteCreator({ note, onClose, onSave, onDelete }: { 
  note?: Note; 
  onClose: () => void; 
  onSave: (note: Omit<Note, 'id' | 'date'>) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [color, setColor] = useState(note?.color || 'bg-white');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const colors = [
    { name: 'White', class: 'bg-white' },
    { name: 'Blue', class: 'bg-blue-50' },
    { name: 'Rose', class: 'bg-rose-50' },
    { name: 'Amber', class: 'bg-amber-50' },
    { name: 'Emerald', class: 'bg-emerald-50' },
    { name: 'Indigo', class: 'bg-indigo-50' },
  ];

  const handleAddTag = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim().toLowerCase())) {
        setTags([...tags, tagInput.trim().toLowerCase()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    onSave({
      title,
      content,
      tags,
      color
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-6"
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto transition-colors duration-300 ${color}`}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">{note ? 'Edit Note' : 'New Note'}</h2>
          <div className="flex gap-2">
            {onDelete && (
              <div className="relative">
                <button 
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)} 
                  className={`p-2 rounded-full transition-colors ${showDeleteConfirm ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-500'}`}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {showDeleteConfirm && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute right-0 top-full mt-2 bg-white border border-neutral-200 rounded-2xl shadow-xl p-4 z-10 w-48"
                    >
                      <p className="text-xs font-bold text-neutral-900 mb-3">Delete this note?</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={onDelete}
                          className="flex-1 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider"
                        >
                          Delete
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-2 bg-neutral-100 text-neutral-600 rounded-xl text-[10px] font-bold uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <button onClick={onClose} className="p-2 rounded-full bg-black/5 text-neutral-500">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Note Title</label>
            <input 
              autoFocus
              type="text" 
              placeholder="Title of your note..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-bold border-none focus:ring-0 p-0 placeholder:text-neutral-300 bg-transparent"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Content</label>
            <textarea 
              placeholder="Start writing..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full text-neutral-700 border-none focus:ring-0 p-0 placeholder:text-neutral-300 resize-none min-h-[200px] bg-transparent leading-relaxed"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Background Color</label>
            <div className="flex gap-3">
              {colors.map(c => (
                <button
                  key={c.class}
                  onClick={() => setColor(c.class)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${c.class} ${color === c.class ? 'border-neutral-900 scale-110 shadow-md' : 'border-transparent'}`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags
            </label>
            <input 
              type="text" 
              placeholder="Add tag and press Enter..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full bg-black/5 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-neutral-200 py-3 px-4"
            />
          </div>

          {/* Tag Chips */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-black/10 text-neutral-700 rounded-full text-xs font-bold uppercase tracking-wider">
                  #{tag}
                  <button onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}

          <button 
            onClick={handleSave}
            disabled={!title.trim() || !content.trim()}
            className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-bold shadow-xl active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all mt-4"
          >
            {note ? 'Update Note' : 'Save Note'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SettingsSection() {
  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { icon: <User className="w-5 h-5" />, label: 'Profile Information', value: 'User Name' },
        { icon: <Bell className="w-5 h-5" />, label: 'Notifications', value: 'On' },
      ]
    },
    {
      title: 'Appearance',
      items: [
        { icon: <Moon className="w-5 h-5" />, label: 'Dark Mode', value: 'System' },
      ]
    },
    {
      title: 'Security',
      items: [
        { icon: <Shield className="w-5 h-5" />, label: 'Privacy & Security', value: '' },
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Settings</h2>
      
      {settingsGroups.map((group, idx) => (
        <div key={idx} className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 px-1">{group.title}</h4>
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
            {group.items.map((item, iIdx) => (
              <button 
                key={iIdx} 
                className={`w-full flex items-center justify-between p-4 active:bg-neutral-50 transition-colors ${iIdx !== group.items.length - 1 ? 'border-b border-neutral-100' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-neutral-500">{item.icon}</div>
                  <span className="font-medium text-neutral-700">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-400">
                  <span className="text-sm">{item.value}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      <button className="w-full py-4 text-rose-500 font-bold bg-rose-50 rounded-2xl border border-rose-100 active:scale-95 transition-transform">
        Log Out
      </button>
    </div>
  );
}
