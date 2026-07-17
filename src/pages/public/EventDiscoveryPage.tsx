import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { EventCard } from '../../components/dashboard/EventCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Select } from '../../components/common/Input';
import { Search, Map, Grid, Sparkles, SlidersHorizontal, MapPin, Compass, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const EventDiscoveryPage: React.FC = () => {
  const { events, currentUser, registerForEvent, navigateTo, colleges, registrations } = useApp();

  // Find current college departments
  const myCollegeObj = colleges.find(c => c.name === currentUser?.collegeName);
  const myCollegeDepts = myCollegeObj ? myCollegeObj.departments : [];

  // URL Query Parameters check (e.g. ?category=tech)
  const getInitialCategory = () => {
    const hash = window.location.hash;
    if (hash.includes('category=')) {
      return hash.split('category=')[1] || 'all';
    }
    return 'all';
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(getInitialCategory());
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  
  // AI Recommendation system state
  const [interestKeywords, setInterestKeywords] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);

  // Sync category state with Hash change
  useEffect(() => {
    const cat = getInitialCategory();
    setSelectedCategory(cat);
  }, [window.location.hash]);

  // Filters calculation
  const filteredEvents = events.filter(evt => {
    if (evt.status !== 'approved') return false;
    
    // Access rule:
    if (currentUser) {
      // Logged-in user: see own college events OR approved open events from other colleges
      const isOwnCollege = evt.collegeId === currentUser.collegeId || evt.collegeName === currentUser.collegeName;
      const isOpenEvent = evt.visibility === 'open';
      if (!isOwnCollege && !isOpenEvent) return false;
    } else {
      // Guest: can ONLY view approved events where visibility = 'open'
      if (evt.visibility !== 'open') return false;
    }
    
    const matchesSearch = evt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          evt.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
                          
    const matchesCategory = selectedCategory === 'all' || evt.category === selectedCategory;
    const matchesDepartment = selectedDepartment === 'all' || evt.department === selectedDepartment;
    const matchesCollege = selectedCollege === 'all' || evt.collegeId === selectedCollege || evt.collegeName === selectedCollege;
    
    return matchesSearch && matchesCategory && matchesDepartment && matchesCollege;
  });

  // Simple Mock AI Recommendations System
  const handleGetRecommendations = () => {
    if (!interestKeywords.trim()) return;
    setIsRecommending(true);
    
    setTimeout(() => {
      const keywords = interestKeywords.toLowerCase().split(/[ ,]+/);
      const scored = events
        .filter(evt => {
          if (evt.status !== 'approved') return false;
          if (currentUser) {
            return evt.collegeId === currentUser.collegeId || evt.visibility === 'open';
          } else {
            return evt.visibility === 'open';
          }
        })
        .map(evt => {
          let score = 0;
          const searchSpace = `${evt.title} ${evt.description} ${evt.tags.join(' ')} ${evt.category}`.toLowerCase();
          keywords.forEach(keyword => {
            if (keyword && searchSpace.includes(keyword)) score += 1;
          });
          return { event: evt, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.event);

      setAiSuggestions(scored.slice(0, 2));
      setIsRecommending(false);
    }, 800);
  };

  const activeEvents = events.filter(evt => {
    if (evt.status !== 'approved') return false;
    if (currentUser) {
      return (evt.collegeId === currentUser.collegeId || evt.collegeName === currentUser.collegeName) || evt.visibility === 'open';
    } else {
      return evt.visibility === 'open';
    }
  });

  return (
    <div className="space-y-8 py-6">
      {/* Search & Filters Banner */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm shadow-slate-100/40 flex flex-col gap-6 animate-fade-in">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Discover Campus Events</h1>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              {currentUser ? (
                <>Explore approved academic panels, fests, and hackathons inside <span className="font-bold text-indigo-600">{currentUser.collegeName}</span>, plus open inter-college events.</>
              ) : (
                <>Explore and participate in open inter-college hackathons, fests, and workshops across multiple campuses.</>
              )}
            </p>
          </div>

          {/* Toggle View Controller */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Grid className="h-4 w-4" />
              <span>Grid List</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'map' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Map className="h-4 w-4" />
              <span>Campus Map</span>
            </button>
          </div>
        </div>

        {/* Filters Matrix */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${currentUser ? 'md:grid-cols-5' : 'md:grid-cols-3'} gap-3`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-xs placeholder:text-slate-400 text-slate-800"
            />
          </div>

          <Select
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'tech', label: 'Tech & Coding' },
              { value: 'academic', label: 'Academic Panels' },
              { value: 'cultural', label: 'Cultural & Music' },
              { value: 'sports', label: 'Athletic Sports' },
              { value: 'career', label: 'Careers & Fairs' }
            ]}
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border-slate-200 text-xs font-semibold py-1.5"
          />

          {currentUser && (
            <>
              <Select
                options={
                  myCollegeDepts.length === 0
                    ? [{ value: 'all', label: 'No Departments Configured' }]
                    : [
                        { value: 'all', label: 'All Departments' },
                        ...myCollegeDepts.map(d => ({ value: d, label: d }))
                      ]
                }
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e.target.value)}
                disabled={myCollegeDepts.length === 0}
                className={`bg-slate-50 border-slate-200 text-xs font-semibold py-1.5 ${myCollegeDepts.length === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
              />

              <Select
                options={[
                  { value: 'all', label: 'All Institutions' },
                  ...colleges.map(c => ({ value: c.id, label: c.name }))
                ]}
                value={selectedCollege}
                onChange={e => setSelectedCollege(e.target.value)}
                className="bg-slate-50 border-slate-200 text-xs font-semibold py-1.5"
              />
            </>
          )}

          {/* Quick reset button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full border-slate-200 hover:bg-slate-50 text-slate-600 text-xs py-1.5"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedDepartment('all');
              setSelectedCollege('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Main Board Section: Split into Grid/Map + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Dynamic Grid or Map */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div
                key="grid-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                {activeEvents.length === 0 ? (
                  <div className="col-span-full py-16 text-center bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                    <SlidersHorizontal className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">No campus events found.</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Department coordinators {currentUser ? `at ${currentUser.collegeName}` : ''} have not registered any upcoming events yet. Check back shortly.
                    </p>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="col-span-full py-16 text-center bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                    <SlidersHorizontal className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">No events matched your search</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Try revising your filters or changing search keywords to discover listings {currentUser ? `inside ${currentUser.collegeName}` : 'across our partner colleges'}.
                    </p>
                  </div>
                ) : (
                  filteredEvents.map((evt, idx) => {
                    const isReg = registrations.some(
                      r => r.eventId === evt.id && r.studentId === currentUser?.id && r.status !== 'cancelled'
                    );
                    return (
                      <EventCard
                        key={evt.id}
                        event={evt}
                        user={currentUser}
                        isRegistered={isReg}
                        onRegister={registerForEvent}
                        onClickDetails={(id) => navigateTo(`/events/${id}`)}
                        delay={idx * 0.08}
                      />
                    );
                  })
                )}
              </motion.div>
            ) : (
              <motion.div
                key="map-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* 100% Custom interactive SVG Map Vector satisfying map requirement */}
                <Card className="p-6 bg-slate-900 text-white min-h-[480px] flex flex-col justify-between border-none relative overflow-hidden">
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold tracking-tight">Interactive Campus Event Hub</h3>
                      <p className="text-[10px] text-slate-400">Map plotting multiple events happening across the academic wings.</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                      <Compass className="h-3.5 w-3.5 animate-spin-slow" />
                      <span>Live Coordinate Sync</span>
                    </div>
                  </div>

                  {/* SVG Map Layout */}
                  <div className="my-6 relative bg-slate-950/80 rounded-2xl border border-slate-800 h-80 flex items-center justify-center p-4">
                    {/* Grid Pattern Background */}
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
                    
                    {/* Campus Paths & Blocks Drawings */}
                    <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50%" cy="50%" r="140" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                      <circle cx="50%" cy="50%" r="80" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="10%" y1="10%" x2="90%" y2="90%" stroke="white" strokeWidth="0.5" />
                      <line x1="90%" y1="10%" x2="10%" y2="90%" stroke="white" strokeWidth="0.5" />
                    </svg>

                    {/* Plot Markers Dynamically */}
                    {filteredEvents.map((evt, idx) => {
                      if (!evt.mapLocation) return null;
                      // Generate somewhat deterministic positioning based on lat/lng parameters
                      const leftPos = `${35 + (evt.mapLocation.lat * 555555) % 40}%`;
                      const topPos = `${25 + (evt.mapLocation.lng * 888888) % 55}%`;
                      
                      return (
                        <div
                          key={evt.id}
                          className="absolute group/marker cursor-pointer"
                          style={{ left: leftPos, top: topPos }}
                          onClick={() => navigateTo(`/events/${evt.id}`)}
                        >
                          {/* Pulsing visual halo */}
                          <div className="absolute -inset-2.5 rounded-full bg-indigo-500/40 animate-ping group-hover/marker:bg-rose-500/40" />
                          <div className="relative h-6 w-6 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center shadow-lg group-hover/marker:bg-rose-600 transition-colors">
                            <MapPin className="h-3.5 w-3.5 text-white" />
                          </div>

                          {/* Hover card popover */}
                          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 p-2.5 rounded-xl shadow-xl w-44 pointer-events-none opacity-0 group-hover/marker:opacity-100 transition-opacity duration-200 z-20">
                            <h4 className="text-[10px] font-bold text-white truncate">{evt.title}</h4>
                            <p className="text-[8px] text-slate-400 flex items-center gap-1 mt-1">
                              <MapPin className="h-2.5 w-2.5" /> {evt.venue}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Central Administration Fountain Point */}
                    <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 bg-white text-slate-950 p-2 rounded-xl text-center shadow-lg border border-slate-200 z-10 shrink-0 select-none">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Campus</p>
                      <p className="text-[10px] font-extrabold text-indigo-600">Central Quad</p>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 font-medium">
                    * Hover on individual map nodes to fetch venue cards. Click a node to jump straight into detailed scheduling panels.
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: AI recommendations Panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 bg-gradient-to-br from-indigo-50/50 via-white to-indigo-50/20 border border-indigo-100 rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600 shadow shadow-indigo-100">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">AI Recommendation Assistant</h3>
                <p className="text-[10px] text-slate-400">Find matching seminars and competitions tailored to your goals.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Input your interests</label>
                <input
                  type="text"
                  placeholder="e.g. coding hackathon, music ensemble, jobs..."
                  value={interestKeywords}
                  onChange={e => setInterestKeywords(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white placeholder:text-slate-400 text-slate-800"
                />
              </div>

              <Button
                variant="primary"
                className="w-full text-xs font-semibold"
                isLoading={isRecommending}
                onClick={handleGetRecommendations}
                disabled={!interestKeywords.trim()}
              >
                Scan My Interests
              </Button>

              <div className="border-t border-indigo-100 pt-4 space-y-3">
                <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase block">Suggested Events</span>
                
                {aiSuggestions.length === 0 ? (
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Type in your keywords (such as "coding", "concert", "academic") and tap scan to fetch intelligence fits.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {aiSuggestions.map(evt => (
                      <div
                        key={evt.id}
                        onClick={() => navigateTo(`/events/${evt.id}`)}
                        className="p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl cursor-pointer shadow-sm hover:shadow transition-all flex gap-3 group"
                      >
                        <img
                          src={evt.imageUrl}
                          alt={evt.title}
                          className="h-12 w-12 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{evt.title}</h4>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-1">
                            <MapPin className="h-3 w-3 shrink-0" /> {evt.venue}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default EventDiscoveryPage;
