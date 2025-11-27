import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  GraduationCap, 
  BrainCircuit, 
  TrendingUp,
  MoreVertical,
  Calendar
} from 'lucide-react';
import { Subject, Score, ViewState, SUBJECT_COLORS, AIInsight } from './types';
import { generateAcademicInsight } from './services/geminiService';
import { PerformanceTrendChart, OverviewBarChart } from './components/Charts';

// --- Utility Components ---

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }> = 
  ({ className, variant = 'primary', ...props }) => {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200",
    ghost: "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
  };
  return (
    <button 
      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${variants[variant]} ${className || ''}`}
      {...props} 
    />
  );
};

const Modal: React.FC<{ title: string; isOpen: boolean; onClose: () => void; children: React.ReactNode }> = 
  ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  // State
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('scholarTrack_subjects');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [view, setView] = useState<ViewState>({ type: 'dashboard' });
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isAddScoreModalOpen, setIsAddScoreModalOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Form States
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newScore, setNewScore] = useState<Partial<Score>>({ date: new Date().toISOString().split('T')[0] });

  // Persistence
  useEffect(() => {
    localStorage.setItem('scholarTrack_subjects', JSON.stringify(subjects));
  }, [subjects]);

  // --- Handlers ---

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    const color = SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length];
    const newSubject: Subject = {
      id: crypto.randomUUID(),
      name: newSubjectName,
      color,
      scores: []
    };
    setSubjects([...subjects, newSubject]);
    setNewSubjectName('');
    setIsAddSubjectModalOpen(false);
  };

  const handleDeleteSubject = (id: string) => {
    if (confirm('Are you sure you want to delete this subject and all its scores?')) {
      setSubjects(subjects.filter(s => s.id !== id));
      if (view.type === 'subject' && view.subjectId === id) {
        setView({ type: 'dashboard' });
      }
    }
  };

  const handleAddScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (view.type !== 'subject') return;
    if (!newScore.title || newScore.value === undefined || newScore.max === undefined) return;

    const score: Score = {
      id: crypto.randomUUID(),
      title: newScore.title,
      value: Number(newScore.value),
      max: Number(newScore.max),
      date: newScore.date || new Date().toISOString().split('T')[0],
      notes: newScore.notes
    };

    setSubjects(subjects.map(s => {
      if (s.id === view.subjectId) {
        return { ...s, scores: [...s.scores, score] };
      }
      return s;
    }));

    setNewScore({ date: new Date().toISOString().split('T')[0] });
    setIsAddScoreModalOpen(false);
  };

  const handleDeleteScore = (subjectId: string, scoreId: string) => {
    setSubjects(subjects.map(s => {
      if (s.id === subjectId) {
        return { ...s, scores: s.scores.filter(sc => sc.id !== scoreId) };
      }
      return s;
    }));
  };

  const fetchAiInsight = async () => {
    setIsAiLoading(true);
    const insight = await generateAcademicInsight(subjects);
    setAiInsight(insight);
    setIsAiLoading(false);
  };

  // --- Computed Views ---

  const activeSubject = view.type === 'subject' ? subjects.find(s => s.id === view.subjectId) : null;
  
  const calculateSubjectAverage = (subject: Subject) => {
    if (subject.scores.length === 0) return 0;
    const totalMax = subject.scores.reduce((sum, s) => sum + s.max, 0);
    const totalScore = subject.scores.reduce((sum, s) => sum + s.value, 0);
    return totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
  };

  const overallAverage = (() => {
    const subjectsWithScores = subjects.filter(s => s.scores.length > 0);
    if (subjectsWithScores.length === 0) return 0;
    const sumAverages = subjectsWithScores.reduce((sum, s) => sum + calculateSubjectAverage(s), 0);
    return Math.round(sumAverages / subjectsWithScores.length);
  })();

  // --- Render Functions ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome & Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-slate-500 font-medium">Overall Average</p>
            <h2 className="text-4xl font-bold text-slate-800 mt-2">{overallAverage}%</h2>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-full">
            <TrendingUp size={16} />
            <span>Across {subjects.length} subjects</span>
          </div>
        </div>

        {/* AI Insight Teaser Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-6 rounded-2xl shadow-md text-white col-span-1 md:col-span-2 relative overflow-hidden">
          <BrainCircuit className="absolute top-4 right-4 text-white/20 w-24 h-24 rotate-12" />
          <div className="relative z-10">
            <h3 className="text-xl font-semibold mb-2">AI Academic Advisor</h3>
            <p className="text-indigo-100 mb-4 max-w-md">
              Get personalized insights on your learning trends and specific study tips to improve your weak areas.
            </p>
            <Button 
              variant="secondary" 
              onClick={fetchAiInsight} 
              disabled={isAiLoading}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              {isAiLoading ? 'Analyzing...' : 'Generate Insights'}
            </Button>
            
            {aiInsight && (
              <div className="mt-6 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 animate-in slide-in-from-bottom-4">
                <p className="text-sm font-medium opacity-90">{aiInsight.analysis}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {aiInsight.tips.map((tip, i) => (
                    <span key={i} className="text-xs bg-black/20 px-2 py-1 rounded-md">{tip}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Subject Performance</h3>
          <OverviewBarChart subjects={subjects} />
        </div>
        
        {/* Subject Grid */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Your Subjects</h3>
            <Button onClick={() => setIsAddSubjectModalOpen(true)} className="text-xs px-3 py-1">
              <Plus size={16} /> Add
            </Button>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {subjects.length === 0 && (
              <p className="text-center text-slate-400 py-8">No subjects yet. Click add to start.</p>
            )}
            {subjects.map(subject => {
              const avg = calculateSubjectAverage(subject);
              return (
                <div 
                  key={subject.id}
                  onClick={() => setView({ type: 'subject', subjectId: subject.id })}
                  className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${subject.color}`}>
                      {subject.name.substring(0, 1)}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">{subject.name}</h4>
                      <p className="text-xs text-slate-500">{subject.scores.length} scores logged</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`text-lg font-bold ${avg >= 80 ? 'text-emerald-600' : avg >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {avg}%
                      </span>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-slate-300 rotate-180 group-hover:text-slate-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSubjectDetail = () => {
    if (!activeSubject) return null;
    const avg = calculateSubjectAverage(activeSubject);

    return (
      <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView({ type: 'dashboard' })}
              className="p-2 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{activeSubject.name}</h1>
              <p className="text-slate-500">Detailed performance history</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right px-4">
              <p className="text-xs text-slate-500 uppercase font-semibold">Current Average</p>
              <p className={`text-2xl font-bold ${activeSubject.color.replace('bg-', 'text-')}`}>{avg}%</p>
            </div>
            <Button variant="danger" className="p-2" onClick={() => handleDeleteSubject(activeSubject.id)}>
              <Trash2 size={20} />
            </Button>
          </div>
        </div>

        {/* Analytics Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Performance Trend</h3>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Last 10 Scores</span>
          </div>
          <PerformanceTrendChart subject={activeSubject} />
        </div>

        {/* Scores List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Score History</h3>
            <Button onClick={() => setIsAddScoreModalOpen(true)}>
              <Plus size={18} /> Add Score
            </Button>
          </div>
          
          <div className="divide-y divide-slate-100">
            {activeSubject.scores.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <p>No scores added yet.</p>
                <p className="text-sm mt-1">Click "Add Score" to log your first result.</p>
              </div>
            ) : (
              [...activeSubject.scores]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(score => {
                  const percentage = Math.round((score.value / score.max) * 100);
                  return (
                    <div key={score.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 p-2 rounded-lg ${percentage >= 80 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                          <GraduationCap size={20} />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{score.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><Calendar size={14} /> {score.date}</span>
                            {score.notes && <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 max-w-[150px] truncate">{score.notes}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-bold text-slate-800">{score.value} <span className="text-slate-400 font-normal text-sm">/ {score.max}</span></p>
                          <p className={`text-xs font-semibold ${percentage >= 80 ? 'text-emerald-500' : percentage >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                            {percentage}%
                          </p>
                        </div>
                        <button 
                          onClick={() => handleDeleteScore(activeSubject.id, score.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setView({ type: 'dashboard' })}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <LayoutDashboard size={18} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-500">
              ScholarTrack
            </span>
          </div>
          <div className="flex items-center gap-3">
             {/* Future: User Profile / Settings */}
             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
               ST
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view.type === 'dashboard' ? renderDashboard() : renderSubjectDetail()}
      </main>

      {/* Modals */}
      <Modal 
        title="Add New Subject" 
        isOpen={isAddSubjectModalOpen} 
        onClose={() => setIsAddSubjectModalOpen(false)}
      >
        <form onSubmit={handleAddSubject}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject Name</label>
              <input 
                autoFocus
                type="text" 
                required
                placeholder="e.g. Mathematics, Physics..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsAddSubjectModalOpen(false)}>Cancel</Button>
              <Button type="submit">Create Subject</Button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal 
        title={`Add Score to ${activeSubject?.name}`} 
        isOpen={isAddScoreModalOpen} 
        onClose={() => setIsAddScoreModalOpen(false)}
      >
        <form onSubmit={handleAddScore}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assessment Title</label>
              <input 
                type="text" 
                required
                autoFocus
                placeholder="e.g. Midterm Exam"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newScore.title || ''}
                onChange={(e) => setNewScore({...newScore, title: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Score Obtained</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newScore.value || ''}
                  onChange={(e) => setNewScore({...newScore, value: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Possible</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  step="0.5"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newScore.max || ''}
                  onChange={(e) => setNewScore({...newScore, max: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input 
                type="date" 
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newScore.date}
                onChange={(e) => setNewScore({...newScore, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
              <textarea 
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="Topics covered, mistakes made..."
                value={newScore.notes || ''}
                onChange={(e) => setNewScore({...newScore, notes: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsAddScoreModalOpen(false)}>Cancel</Button>
              <Button type="submit">Add Score</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default App;