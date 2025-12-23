
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, BookOpen, School, ChevronRight, 
  ChevronLeft, Sparkles, MessageCircle, 
  Send, User, Clock, CheckCircle2, 
  GraduationCap, Building2, Calculator, 
  AlertCircle, X, ExternalLink, Star, 
  LayoutDashboard, Languages, ShieldCheck,
  FileText, Zap, Minus, Maximize2, MousePointer2,
  Trophy, Target, Users, ArrowDown, ShieldAlert,
  Flame, Book, MoveDiagonal2, Mail, GraduationCap as GraduateIcon,
  Award, Presentation, Globe, Plus, ChevronDown, ChevronUp
} from 'lucide-react';
import { EXTENDED_FACULTIES, POPULAR_TAGS, THAI_UNIVERSITIES, TRANSLATIONS } from './constants.ts';
import { searchUniversities, getUniversityDetails, chatWithAiStream } from './services/gemini.ts';
import { UniversityData, ChatMessage, RecommendedTutor, Tutor } from './types.ts';

const App: React.FC = () => {
  const [lang, setLang] = useState<'th' | 'en'>('th');
  const t = TRANSLATIONS[lang];

  const [view, setView] = useState<'home' | 'search' | 'universities' | 'dashboard'>('home');
  
  const [faculty, setFaculty] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [universityList, setUniversityList] = useState<string[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [universityDetails, setUniversityDetails] = useState<UniversityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  
  const [customUni, setCustomUni] = useState('');
  const [customUniSuggestions, setCustomUniSuggestions] = useState<string[]>([]);

  const [expandedTutors, setExpandedTutors] = useState<Record<number, boolean>>({});

  const [chatSize, setChatSize] = useState({ width: 340, height: 480 });
  const [isResizing, setIsResizing] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const searchSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const maxWidth = window.innerWidth * 0.9;
      const maxHeight = window.innerHeight * 0.8;
      const newWidth = Math.min(Math.max(window.innerWidth - e.clientX - 32, 280), maxWidth);
      const newHeight = Math.min(Math.max(window.innerHeight - e.clientY - 32, 350), maxHeight);
      setChatSize({ width: newWidth, height: newHeight });
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'th' ? 'en' : 'th');
  };

  const handleFacultyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFaculty(val);
    if (val.trim()) {
      const filtered = EXTENDED_FACULTIES.filter(f => f.includes(val)).slice(0, 6);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleCustomUniInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomUni(val);
    if (val.trim()) {
      const filtered = THAI_UNIVERSITIES.filter(u => u.includes(val)).slice(0, 6);
      setCustomUniSuggestions(filtered);
    } else {
      setCustomUniSuggestions([]);
    }
  };

  const startSearch = async (val?: string) => {
    const searchVal = val || faculty;
    if (!searchVal.trim()) return;
    setFaculty(searchVal);
    setSuggestions([]);
    setIsLoading(true);
    setError(null);
    try {
      const list = await searchUniversities(searchVal, lang);
      setUniversityList(list);
      setView('universities');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(t.errorTitle);
    } finally {
      setIsLoading(false);
    }
  };

  const selectUniversity = async (uni: string) => {
    setSelectedUniversity(uni);
    setCustomUni('');
    setCustomUniSuggestions([]);
    setIsLoading(true);
    setError(null);
    setExpandedTutors({});
    try {
      const details = await getUniversityDetails(faculty, uni, lang);
      if (details && details.rounds && details.rounds.length > 0) {
        setUniversityDetails(details);
        const intro = lang === 'th' 
          ? `พี่ AI ค้นหาข้อมูล ${faculty} ของ ${uni} มาให้แล้วครับ! (ตรวจสอบความถูกต้องจากประกาศทางการอีกครั้งนะครับ)`
          : `I've found the ${faculty} criteria for ${uni}! (Please re-verify with official announcements)`;
        setChat([{ role: 'ai', text: intro }]);
        setView('dashboard');
        setIsChatOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(t.errorTitle);
      }
    } catch (err) {
      setError(t.errorTitle);
    } finally {
      setIsLoading(false);
    }
  };

  const openContactChat = () => {
    setIsChatOpen(true);
    setIsChatMinimized(false);
    const msg = lang === 'th' 
      ? 'สวัสดีครับน้อง พี่ AI และทีมงานยินดีให้บริการครับ มีเรื่องสอบถามตรงไหนแจ้งได้เลย!' 
      : 'Hello! Pee AI and the team are here to help.';
    setChat(prev => [...prev, { role: 'ai', text: msg }]);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;
    const userMsg = chatInput.trim();
    setChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsChatSending(true);
    
    setChat(prev => [...prev, { role: 'ai', text: '' }]);

    try {
      const stream = await chatWithAiStream(faculty, selectedUniversity, userMsg, lang);
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        setChat(prev => {
          const newChat = [...prev];
          newChat[newChat.length - 1].text = fullText;
          return newChat;
        });
      }
    } catch (err) {
      setChat(prev => {
        const newChat = [...prev];
        newChat[newChat.length - 1].text = 'ขออภัยครับน้อง พี่ AI ขัดข้องนิดหน่อย ลองใหม่อีกครั้งนะครับ';
        return newChat;
      });
    } finally {
      setIsChatSending(false);
    }
  };

  const goToSearch = () => {
    setView('search');
    setTimeout(() => {
      searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const toggleTutorExpand = (index: number) => {
    setExpandedTutors(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className={`min-h-screen flex flex-col relative overflow-x-hidden text-slate-900 bg-slate-50 ${isResizing ? 'cursor-nwse-resize select-none' : ''}`}>
      <nav className="fixed top-0 w-full z-[60] h-20 px-6 bg-white/90 backdrop-blur-xl border-b border-slate-100 flex items-center shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => { setView('home'); setFaculty(''); setError(null); setUniversityDetails(null); }}
          >
            <div className="bg-indigo-600 text-white p-2.5 rounded-2xl group-hover:rotate-12 transition-all shadow-lg shadow-indigo-200">
              <BookOpen size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter text-slate-900">TCAS <span className="text-indigo-600">Genius</span></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Professional Edition</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <button onClick={() => setView('home')} className={`text-sm font-bold transition-colors ${view === 'home' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>หน้าแรก</button>
            <button onClick={goToSearch} className={`text-sm font-bold transition-colors ${view === 'search' || view === 'universities' || view === 'dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>ค้นหาเกณฑ์</button>
            <button onClick={openContactChat} className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">ติดต่อผู้ดูแล</button>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleLanguage} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-sm font-bold transition-all flex items-center gap-2">
              <Languages size={16} className="text-indigo-600" />
              <span>{t.langName}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-20">
        {isLoading && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-sm animate-fade-in">
            <div className="relative mb-6 text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 border-4 border-indigo-100 rounded-full"></div>
                <div className="w-24 h-24 border-4 border-indigo-600 rounded-full border-t-transparent absolute top-0 left-0 animate-spin"></div>
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 animate-pulse" size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mt-6">{t.loadingTitle}</h3>
              <p className="text-slate-500 font-bold mt-2">ประมวลผลด้วย AI Flash Engine (Speed Optimized)</p>
            </div>
          </div>
        )}

        {view === 'home' && (
          <div className="animate-fade-in">
            <section className="relative min-h-[90vh] flex items-center justify-center px-6 overflow-hidden">
              <div className="max-w-6xl mx-auto text-center relative z-10 flex flex-col items-center justify-center">
                <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-10 shadow-sm border border-indigo-100">
                  <Trophy size={14} /> Developed by MR.Achira Saiwaree
                </div>
                <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-8 leading-[1] tracking-tighter">
                  {t.heroTitle} <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600">{t.heroTitleHighlight}</span>
                </h1>
                <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                  {t.heroDesc}
                </p>
                <div className="flex justify-center w-full">
                  <button onClick={goToSearch} className="group px-12 py-7 bg-indigo-600 text-white font-black rounded-3xl hover:bg-slate-900 transition-all shadow-2xl shadow-indigo-200 text-2xl flex items-center gap-4">
                    เริ่มค้นหาคณะในฝัน <ChevronRight size={28} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {view === 'search' && (
           <div className="animate-fade-in max-w-4xl mx-auto py-20 px-6" ref={searchSectionRef}>
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">ค้นหาเกณฑ์การรับสมัคร</h2>
              </div>
              <div className="relative z-30 mb-20">
                <div className="relative group">
                  <input type="text" value={faculty} onChange={handleFacultyInput} placeholder={t.searchPlaceholder} className="w-full px-8 py-6 pl-16 bg-white border-2 border-slate-100 rounded-[2rem] text-lg shadow-xl outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300 font-medium" onKeyDown={(e) => e.key === 'Enter' && startSearch()} />
                  <Search size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" />
                  <button onClick={() => startSearch()} disabled={!faculty.trim()} className="absolute right-2 top-2 bottom-2 px-10 bg-indigo-600 text-white font-black rounded-[1.6rem] hover:bg-slate-900 transition-all disabled:opacity-50">{t.searchBtn}</button>
                </div>
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 overflow-hidden text-left divide-y divide-slate-50 z-40">
                    {suggestions.map((s, idx) => (
                      <div key={idx} onClick={() => startSearch(s)} className="px-8 py-5 hover:bg-slate-50 cursor-pointer text-slate-700 flex items-center justify-between group">
                        <span className="font-bold text-lg">{s}</span><ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
           </div>
        )}

        {view === 'universities' && (
           <div className="animate-fade-in max-w-7xl mx-auto py-10 px-6">
             <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
               <div className="flex items-center gap-6">
                 <button onClick={() => setView('search')} className="p-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all"><ChevronLeft size={24} /></button>
                 <div>
                   <h2 className="text-3xl font-black text-slate-900">{t.selectUniTitle}</h2>
                   <p className="text-slate-500 font-bold">{t.foundUnis} <span className="text-indigo-600">"{faculty}"</span></p>
                 </div>
               </div>
             </div>

             <div className="max-w-4xl mx-auto bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm mb-16">
                <div className="flex flex-col md:flex-row items-center gap-6">
                   <div className="flex-1 w-full relative">
                      <div className="relative group">
                         <input 
                           type="text" 
                           value={customUni} 
                           onChange={handleCustomUniInput} 
                           placeholder={t.customUniPlaceholder} 
                           className="w-full px-6 py-4 pl-12 bg-slate-50 border-none rounded-2xl text-md shadow-inner outline-none focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 font-bold" 
                           onKeyDown={(e) => e.key === 'Enter' && customUni && selectUniversity(customUni)} 
                         />
                         <Building2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" />
                         <button 
                           onClick={() => selectUniversity(customUni)} 
                           disabled={!customUni.trim()} 
                           className="absolute right-2 top-2 bottom-2 px-6 bg-slate-950 text-white font-black rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-50 text-sm"
                         >
                           {t.checkBtn}
                         </button>
                      </div>
                      {customUniSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-left z-40 divide-y divide-slate-50">
                           {customUniSuggestions.map((u, i) => (
                             <div key={i} onClick={() => selectUniversity(u)} className="px-6 py-4 hover:bg-slate-50 cursor-pointer text-slate-700 font-bold text-sm transition-colors">{u}</div>
                           ))}
                        </div>
                      )}
                   </div>
                   <div className="shrink-0 text-center md:text-left">
                      <h4 className="text-sm font-black text-slate-900">{t.customUniTitle}</h4>
                      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{t.customUniDesc}</p>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
               {universityList.map((uni, idx) => (
                 <button key={idx} onClick={() => selectUniversity(uni)} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-sm hover:shadow-xl hover:border-indigo-50 text-left transition-all group">
                   <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all"><School size={32} /></div>
                   <h3 className="font-black text-xl text-slate-800">{uni}</h3>
                 </button>
               ))}
             </div>
           </div>
        )}

        {view === 'dashboard' && universityDetails && (
           <div className="animate-fade-in space-y-12 max-w-6xl mx-auto py-10 px-6 pb-32">
              <div className="bg-slate-950 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                   <School size={160} />
                 </div>
                 <button onClick={() => setView('universities')} className="text-white/40 hover:text-white mb-8 block font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-colors">
                   <ChevronLeft size={16} /> กลับไปเลือกสถาบัน
                 </button>
                 <div className="relative z-10">
                    <span className="inline-block px-4 py-1.5 bg-indigo-600/30 border border-indigo-500/30 rounded-full text-indigo-400 text-xs font-black uppercase tracking-widest mb-6">Verified Criteria 2025</span>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter leading-tight">{faculty}</h1>
                    <p className="text-xl md:text-3xl font-light italic text-white/60 flex items-center gap-3">
                      <School size={28} className="text-indigo-500" /> {selectedUniversity}
                    </p>
                    
                    <div className="mt-8">
                       <a 
                         href={`https://www.mytcas.com/search?q=${encodeURIComponent(selectedUniversity)}`} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-white text-sm font-black transition-all group"
                       >
                         <Globe size={18} className="text-indigo-400 group-hover:rotate-12 transition-transform" />
                         ดูข้อมูลเพิ่มเติมที่ MyTCAS.com
                         <ExternalLink size={14} className="opacity-40" />
                       </a>
                    </div>
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600"><LayoutDashboard size={20} /></div>
                    <h2 className="text-3xl font-black text-slate-900">{t.roundsTitle}</h2>
                 </div>
                 <div className="grid grid-cols-1 gap-8">
                   {universityDetails.rounds.map((round, i) => (
                     <div key={i} className="group bg-white rounded-[2.5rem] border-2 border-slate-100 p-8 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-50">
                           <div className="flex items-center gap-6">
                              <div className="w-16 h-16 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-black text-3xl shadow-lg group-hover:scale-110 transition-transform">
                                {i + 1}
                              </div>
                              <div>
                                <h3 className="font-black text-2xl text-slate-800">{round.round_name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className={`w-2 h-2 rounded-full ${round.isOpen ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                  <span className={`text-xs font-black uppercase tracking-widest ${round.isOpen ? 'text-green-600' : 'text-slate-400'}`}>
                                    {round.isOpen ? t.roundStatusOpen : t.roundStatusClosed}
                                  </span>
                                </div>
                              </div>
                           </div>
                           {round.link && (
                             <a href={round.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-3 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-xl text-slate-600 text-sm font-black transition-all">
                               {t.viewOfficialBtn} <ExternalLink size={16} />
                             </a>
                           )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="space-y-6">
                              <div>
                                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2"><User size={14}/> {t.eligibilityLabel}</p>
                                <div className="bg-slate-50 p-6 rounded-2xl text-slate-700 font-bold leading-relaxed border border-slate-100">
                                   {round.eligibility}
                                </div>
                              </div>
                              {round.gpa_requirement && (
                                <div>
                                  <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2"><CheckCircle2 size={14}/> {t.gpaxLabel}</p>
                                  <div className="inline-block px-6 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 font-black">
                                     {round.gpa_requirement}
                                  </div>
                                </div>
                              )}
                           </div>
                           <div>
                              <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2"><Calculator size={14}/> {t.scoresLabel}</p>
                              <div className="space-y-3">
                                 {round.exam_scores.map((score, si) => (
                                   <div key={si} className="flex justify-between items-center p-5 bg-white border-2 border-slate-50 rounded-2xl group-hover:border-indigo-50 transition-colors">
                                      <span className="font-bold text-slate-700 flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                        {score.subject}
                                      </span>
                                      <span className="font-black text-indigo-600 text-lg">{score.weight}</span>
                                   </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}
                 </div>
              </div>

              <div className="pt-12 border-t-2 border-slate-100">
                 <div className="flex items-center gap-4 mb-10">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600"><GraduateIcon size={20} /></div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-900">{t.tutorTitle}</h2>
                      <p className="text-slate-500 font-bold text-sm">แหล่งเรียนรู้และติวเตอร์ชั้นนำที่คัดสรรมาให้ตามรายวิชาที่ต้องใช้สอบ</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {universityDetails.recommended_tutors.map((rec, ri) => {
                       const isExpanded = expandedTutors[ri] || false;
                       const displayTutors = isExpanded ? rec.tutors : rec.tutors.slice(0, 2);
                       const hasMore = rec.tutors.length > 2;

                       return (
                        <div key={ri} className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-8 flex flex-col h-full">
                           <h4 className="flex items-center gap-3 font-black text-xl text-slate-900 mb-6 pb-4 border-b border-slate-200">
                              <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm"><Presentation size={18} /></div>
                              {t.tutorSubject}: <span className="text-indigo-600">{rec.subject}</span>
                           </h4>
                           <div className="space-y-6 flex-1">
                              {displayTutors.map((tutor, ti) => (
                                 <div key={ti} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow animate-fade-in">
                                    <div className="flex items-start justify-between mb-3">
                                       <h5 className="font-black text-lg text-slate-800">{tutor.name}</h5>
                                       <Star size={16} className="text-orange-400 fill-orange-400" />
                                    </div>
                                    <p className="text-indigo-600 text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-2">
                                       <Award size={12} /> {tutor.highlight}
                                    </p>
                                    <p className="text-slate-500 text-sm font-bold leading-relaxed bg-slate-50 p-4 rounded-xl">
                                       {tutor.teaching_style}
                                    </p>
                                 </div>
                              ))}
                           </div>
                           
                           {hasMore && (
                             <button 
                               onClick={() => toggleTutorExpand(ri)}
                               className="mt-8 flex items-center justify-center gap-2 w-full py-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-600 font-black hover:border-indigo-600 hover:text-indigo-600 transition-all text-sm group"
                             >
                               {isExpanded ? (
                                 <>น้อยลง <ChevronUp size={18} className="group-hover:-translate-y-1 transition-transform" /></>
                               ) : (
                                 <>ดูติวเตอร์เพิ่มเติมอีก {rec.tutors.length - 2} ท่าน <ChevronDown size={18} className="group-hover:translate-y-1 transition-transform" /></>
                               )}
                             </button>
                           )}
                        </div>
                       );
                    })}
                 </div>
                 <p className="mt-12 text-center text-slate-400 font-bold text-xs flex items-center justify-center gap-2 italic">
                   <AlertCircle size={14} /> {t.tutorModalNote}
                 </p>
              </div>
           </div>
        )}

        {error && (
          <div className="max-w-xl mx-auto py-20 px-6 text-center animate-fade-in">
            <div className="bg-red-50 p-10 rounded-[2rem] border-2 border-red-100">
               <AlertCircle size={48} className="mx-auto text-red-500 mb-6" />
               <p className="text-xl font-black text-red-700 mb-6">{t.errorTitle}</p>
               <button onClick={() => setView('search')} className="px-8 py-4 bg-red-600 text-white font-black rounded-xl">ลองค้นหาใหม่อีกครั้ง</button>
            </div>
          </div>
        )}
      </main>

      <div className={`fixed bottom-8 right-8 z-[70] flex flex-col items-end gap-5`}>
        {isChatOpen && (
          <div 
            style={{ 
              width: isChatMinimized ? '56px' : `${chatSize.width}px`, 
              height: isChatMinimized ? '56px' : `${chatSize.height}px`,
              maxWidth: '90vw',
              maxHeight: '80vh',
              transition: isResizing ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.3s ease'
            }}
            className={`bg-white shadow-2xl border-2 border-slate-100 overflow-hidden flex flex-col relative ${isChatMinimized ? 'rounded-full' : 'rounded-[2rem]'}`}
          >
            {!isChatMinimized && (
              <div onMouseDown={startResizing} className="absolute top-0 left-0 w-8 h-8 cursor-nwse-resize flex items-center justify-center z-[80] group">
                <div className="w-5 h-5 bg-slate-50/80 backdrop-blur rounded-lg flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <MoveDiagonal2 size={10} />
                </div>
              </div>
            )}
            <div 
              className={`bg-slate-950 text-white flex items-center shrink-0 transition-all ${isChatMinimized ? 'w-full h-full justify-center p-0 cursor-pointer hover:bg-indigo-950' : 'p-4 justify-between'}`}
              onClick={isChatMinimized ? () => setIsChatMinimized(false) : undefined}
            >
              {isChatMinimized ? (
                <div className="relative"><MessageCircle size={24} className="text-indigo-400" /></div>
              ) : (
                <>
                  <div className="flex items-center gap-3 ml-6">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><MessageCircle size={16} /></div>
                    <div><p className="font-black text-xs tracking-tighter">TCAS Genius Assistant</p></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setIsChatMinimized(true)} className="p-1.5 hover:bg-white/10 rounded-lg"><Minus size={14} /></button>
                    <button onClick={() => setIsChatOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg"><X size={14} /></button>
                  </div>
                </>
              )}
            </div>
            {!isChatMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                  {chat.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed font-bold shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                        {msg.text || (msg.role === 'ai' ? '...' : '')}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleChat} className="p-4 bg-white border-t border-slate-50 shrink-0">
                  <div className="relative">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="พิมพ์ข้อความ..." className="w-full px-4 py-2.5 pr-12 bg-slate-50 rounded-xl border-none focus:ring-1 focus:ring-indigo-200 outline-none text-xs font-bold" />
                    <button type="submit" disabled={!chatInput.trim() || isChatSending} className="absolute right-1 top-1 bottom-1 w-8 h-8 bg-slate-950 text-white rounded-lg flex items-center justify-center hover:bg-indigo-600 transition-all disabled:opacity-50"><Send size={14} /></button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
        {!isChatOpen && (
          <button onClick={() => setIsChatOpen(true)} className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-slate-900 transition-all animate-bounce"><MessageCircle size={28} /></button>
        )}
      </div>

      <footer className="mt-20 border-t-2 border-slate-100 py-24 px-10 bg-white">
        <div className="max-w-7xl mx-auto">
           <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
              <div className="md:col-span-4">
                 <div className="flex items-center gap-4 mb-8 justify-center md:justify-start">
                    <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-xl"><BookOpen size={20} /></div>
                    <span className="font-black text-2xl tracking-tighter text-slate-900">TCAS <span className="text-indigo-600">Genius</span></span>
                 </div>
                 <p className="text-slate-500 font-bold leading-relaxed opacity-60 italic max-w-xs mx-auto md:mx-0 text-center md:text-left">
                    "ติดคณะในฝัน ด้วยข้อมูลที่แม่นยำที่สุด"
                 </p>
              </div>
              <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-8">
                 <div>
                    <h5 className="font-black text-slate-900 mb-6 flex items-center gap-2 justify-center md:justify-start"><Users size={18} className="text-indigo-600"/> ทีมงานผู้พัฒนา</h5>
                    <ul className="space-y-4 text-center md:text-left">
                       <li><p className="text-xs font-black text-slate-400 uppercase mb-1">Developer</p><p className="font-bold text-slate-700">Mr. Achira Saiwaree</p></li>
                       <li><p className="text-xs font-black text-slate-400 uppercase mb-1">Administrators</p><p className="font-bold text-slate-600 text-sm">Mr. Narongsak Panthong</p><p className="font-bold text-slate-600 text-sm">Mr. Phoorithat Khuankij</p><p className="font-bold text-slate-600 text-sm">Mr. Weerachot Maneechot</p></li>
                    </ul>
                 </div>
                 <div>
                    <h5 className="font-black text-slate-900 mb-6 flex items-center gap-2 justify-center md:justify-start"><Mail size={18} className="text-indigo-600"/> ติดต่อสอบถาม</h5>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 inline-block md:block w-full text-center md:text-left">
                       <a href="mailto:11167@triamudomsouth.ac.th" className="font-black text-indigo-600 hover:text-slate-900 transition-colors break-all">11167@triamudomsouth.ac.th</a>
                    </div>
                 </div>
              </div>
           </div>
           <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40">
              <p className="text-slate-400 font-bold text-xs">Developed by MR.Achira Saiwaree & Team © 2025 All Rights Reserved.</p>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
