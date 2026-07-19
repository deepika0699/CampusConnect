import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Input';
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  Users, 
  ShieldCheck, 
  Mail, 
  Calendar, 
  Award,
  QrCode,
  Volume2,
  VolumeX,
  Camera,
  AlertTriangle,
  Check,
  Loader2,
  ArrowRight
} from 'lucide-react';

export const CoordinatorRegistrations: React.FC = () => {
  const { currentUser, events, registrations, markAttendance, certificates } = useApp();
  
  // Coordinator's events
  const coordEvents = events.filter(e => e.coordinatorId === currentUser?.id);
  
  const [selectedEventId, setSelectedEventId] = useState<string>(
    coordEvents.length > 0 ? coordEvents[0].id : ''
  );
  const [studentSearch, setStudentSearch] = useState('');
  
  // QR Scanner specific States
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState<{
    registration: any;
    alreadyCheckedIn: boolean;
    message: string;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [simulatedStudentId, setSimulatedStudentId] = useState('');

  if (!currentUser) return null;

  const currentEvent = coordEvents.find(e => e.id === selectedEventId);
  
  // Registrations for selected event matching manual search
  const eventRegs = registrations.filter(
    r => r.eventId === selectedEventId && 
    (
      r.studentName.toLowerCase().includes(studentSearch.toLowerCase()) || 
      r.studentEmail.toLowerCase().includes(studentSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(studentSearch.toLowerCase())
    )
  );

  const activeEventRegs = eventRegs.filter(r => r.status !== 'cancelled');
  
  // Non-attended registrations for simulator options
  const pendingRegsForSimulation = registrations.filter(
    r => r.eventId === selectedEventId && r.status === 'registered'
  );

  // Play auditory tone feedback for scan outcome
  const playAudioFeedback = (success: boolean) => {
    if (!audioEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Node 1: Oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (success) {
        // High double-tone chime
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1); // D6
        gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.1);
        osc2.start(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + 0.22);
      } else {
        // Low error buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn("Native sound synthesis muted by browser policy:", e);
    }
  };

  // Scan handler for direct text/manual scan codes
  const handleScanSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    await processScanCode(scanInput);
    setScanInput('');
  };

  // Perform Simulated Scanning
  const handleTriggerSimulation = async () => {
    if (!simulatedStudentId) return;
    const targetReg = registrations.find(r => r.id === simulatedStudentId);
    if (!targetReg) return;

    setIsScanning(true);
    setScanError('');
    setScanSuccess(null);

    // Simulate 750ms camera scanning transition
    setTimeout(async () => {
      setIsScanning(false);
      const fakeQRCodeData = `CC-REG-${targetReg.eventId}-${targetReg.studentId}-registered`;
      await processScanCode(fakeQRCodeData);
      setSimulatedStudentId('');
    }, 750);
  };

  // Standard scanning logic engine
  const processScanCode = async (code: string) => {
    setScanError('');
    setScanSuccess(null);

    if (!code || !code.trim()) {
      setScanError('Empty code detected. Please enter or select a pass reference.');
      playAudioFeedback(false);
      return;
    }

    const trimmed = code.trim();
    let targetReg = null;

    // Pattern 1: Fully-qualified QR Admission payload format
    if (trimmed.startsWith('CC-REG-')) {
      targetReg = registrations.find(r => {
        if (r.eventId !== selectedEventId || r.status === 'cancelled') return false;
        const expectedCode = `CC-REG-${r.eventId}-${r.studentId}-registered`;
        return expectedCode === trimmed;
      });
    }

    // Pattern 2: Loose verification check by matching Registration ID
    if (!targetReg) {
      targetReg = registrations.find(r => 
        r.id === trimmed && 
        r.eventId === selectedEventId && 
        r.status !== 'cancelled'
      );
    }

    // Pattern 3: Fallback loose match - look up studentId contained in the string
    if (!targetReg && trimmed.startsWith('CC-REG-')) {
      targetReg = registrations.find(r => 
        r.eventId === selectedEventId && 
        r.status !== 'cancelled' && 
        trimmed.includes(r.studentId)
      );
    }

    // Validation checks
    if (!targetReg) {
      setScanError('Access Denied: No active matching registration found for this event.');
      playAudioFeedback(false);
      return;
    }

    // Multi-campus/coordinator authorization safeguards
    if (!currentEvent || currentEvent.collegeId !== currentUser.collegeId) {
      setScanError('Security Restrict: You cannot process check-ins outside your own college campus.');
      playAudioFeedback(false);
      return;
    }

    // Check for duplicate scanning
    if (targetReg.status === 'attended') {
      setScanSuccess({
        registration: targetReg,
        alreadyCheckedIn: true,
        message: `Already Checked In! Verified at ${targetReg.attendedAt ? new Date(targetReg.attendedAt).toLocaleTimeString() : 'an earlier session'}.`
      });
      setScanError('Already Checked In: Student has previously validated entry.');
      playAudioFeedback(false);
      return;
    }

    // Execute safe state mutation
    try {
      await markAttendance(targetReg.id, true);
      setScanSuccess({
        registration: targetReg,
        alreadyCheckedIn: false,
        message: `Check-in Confirmed! Welcome to the event.`
      });
      playAudioFeedback(true);
    } catch (err) {
      console.error(err);
      setScanError('Database write error. Check net connectivity and retry.');
      playAudioFeedback(false);
    }
  };

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">On-site Attendance & Check-in Desk</h1>
          <p className="text-xs text-slate-400 font-semibold">Verify admission QR passes, log attendance, and issue certificates.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button 
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-center ${
              audioEnabled 
                ? 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100' 
                : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
            }`}
            title={audioEnabled ? "Mute audio chimes" : "Enable audio chimes"}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {coordEvents.length === 0 ? (
        <Card className="p-12 text-center text-slate-400">
          <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold">No active events to manage</p>
          <p className="text-xs text-slate-400 mt-1">Please create an event first to activate the check-in desk.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Bar */}
          <div className="lg:col-span-12 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-4">
            <div className="w-full md:w-1/2">
              <Select
                label="Select Campus Event"
                options={coordEvents.map(e => ({ value: e.id, label: `${e.title} (${e.date})` }))}
                value={selectedEventId}
                onChange={e => {
                  setSelectedEventId(e.target.value);
                  setStudentSearch('');
                  setScanError('');
                  setScanSuccess(null);
                }}
                className="bg-slate-50 border-slate-200"
              />
            </div>

            <div className="w-full md:w-1/2 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Search Students (ID, Name, or Email)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter name, university email, or Registration ID (reg_...)"
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm bg-slate-50 focus:bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Left Column: Live Scan Admissions Terminal */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="space-y-1.5 border-b border-slate-50 pb-3">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                  <QrCode className="h-4 w-4 text-indigo-500" /> Live QR Scanner Console
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Verify cryptographically signed admission QR tickets in real-time.</p>
              </div>

              {/* Glowing Laser Scanner viewport simulator */}
              <div className="relative aspect-video w-full rounded-2xl bg-slate-900 overflow-hidden flex flex-col items-center justify-center p-4 border border-slate-800">
                
                {/* Simulated scan target focus lines */}
                <div className="absolute inset-4 border border-indigo-500/10 rounded-xl pointer-events-none" />
                <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-indigo-400 rounded-tl pointer-events-none" />
                <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-indigo-400 rounded-tr pointer-events-none" />
                <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-indigo-400 rounded-bl pointer-events-none" />
                <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-indigo-400 rounded-br pointer-events-none" />

                {/* Laser scan animation overlay */}
                <div className={`absolute left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)] ${
                  isScanning ? 'animate-bounce top-1/2' : 'animate-pulse top-1/3'
                }`} />

                {/* Video camera details HUD */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[9px] font-bold uppercase text-indigo-400 tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 absolute" />
                  <span>LIVE SCANNER STREAM</span>
                </div>

                {isScanning ? (
                  <div className="flex flex-col items-center gap-2 text-white/90">
                    <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Decoding Pass...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400 text-center">
                    <Camera className="h-8 w-8 text-slate-700 animate-pulse" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Awaiting QR scan input</p>
                    <p className="text-[9px] text-slate-600 font-medium max-w-xs leading-relaxed">
                      Use the simulator selector below to mimic an instant laser pass check-in, or type a ref code.
                    </p>
                  </div>
                )}
              </div>

              {/* QR Code Scan Testing Simulator tool */}
              <div className="bg-slate-50/80 border border-slate-100 p-4.5 rounded-2xl space-y-3.5">
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-slate-700 tracking-wider uppercase">Pass Scanner Testing Simulator</h4>
                  <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                    Simulate a mobile phone QR Code scan to verify database check-ins and certificate minting instantly.
                  </p>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <select
                      value={simulatedStudentId}
                      onChange={e => setSimulatedStudentId(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs bg-white font-semibold"
                    >
                      <option value="">-- Choose Registered Student --</option>
                      {pendingRegsForSimulation.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.studentName} ({r.id.substr(0, 8)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!simulatedStudentId || isScanning}
                    className="bg-indigo-600 hover:bg-indigo-700 text-xs py-1.5 shrink-0 font-bold"
                    onClick={handleTriggerSimulation}
                  >
                    Simulate Scan
                  </Button>
                </div>
              </div>

              {/* Scanner feedback notifications HUD */}
              {(scanError || scanSuccess) && (
                <div className="space-y-3">
                  {scanError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2.5 text-rose-700">
                      <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-extrabold">Check-In Rejected</p>
                        <p className="text-[10px] font-medium leading-relaxed">{scanError}</p>
                      </div>
                    </div>
                  )}

                  {scanSuccess && (
                    <div className={`p-4 border rounded-2xl flex items-start gap-3 ${
                      scanSuccess.alreadyCheckedIn 
                        ? 'bg-amber-50 border-amber-100 text-amber-700' 
                        : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    }`}>
                      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        scanSuccess.alreadyCheckedIn ? 'bg-amber-100' : 'bg-emerald-100'
                      }`}>
                        {scanSuccess.alreadyCheckedIn 
                          ? <AlertTriangle className="h-4 w-4" /> 
                          : <Check className="h-4 w-4 text-emerald-600" />
                        }
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="text-xs font-extrabold">
                          {scanSuccess.alreadyCheckedIn ? 'Duplicate Scan' : 'Admission Allowed'}
                        </p>
                        <p className="text-[10px] font-semibold leading-relaxed">{scanSuccess.message}</p>
                        
                        <div className="pt-2 border-t border-slate-200/10 mt-2 text-[10px] space-y-0.5">
                          <p className="font-extrabold text-slate-800">
                            Student: <span className="font-bold">{scanSuccess.registration.studentName}</span>
                          </p>
                          <p className="font-medium text-slate-400">
                            Seat ID: <span className="font-mono">{scanSuccess.registration.id}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Text Input manual entry panel */}
              <form onSubmit={handleScanSubmission} className="space-y-2 pt-2 border-t border-slate-50">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">Manual Code Checker</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Paste QR payload or manual Registration ID..."
                      value={scanInput}
                      onChange={e => setScanInput(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs bg-slate-50"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="border-slate-200 text-xs py-1.5"
                  >
                    Submit
                  </Button>
                </div>
              </form>

            </Card>
          </div>

          {/* Right Column: Attendance roster checklist spreadsheet */}
          <div className="lg:col-span-7">
            <Card className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50/80 bg-slate-50/30 flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-slate-800">Student Admissions Checklist</h3>
                <span className="text-xs text-slate-400 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-100">
                  {activeEventRegs.length} total seats reserved
                </span>
              </div>

              {activeEventRegs.length === 0 ? (
                <div className="p-16 text-center text-slate-400">
                  <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-xs font-semibold">No student matching this inquiry registered.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Refine your search term or promote across university forums.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-400 uppercase tracking-widest font-bold text-[9px]">
                        <th className="py-3 px-6">Student Information</th>
                        <th className="py-3 px-6">Booked Date</th>
                        <th className="py-3 px-6 text-center">QR Registration Code</th>
                        <th className="py-3 px-6 text-center">Desk Check-in / Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                      {activeEventRegs.map((reg) => {
                        const cert = certificates.find(c => c.registrationId === reg.id);
                        return (
                          <tr key={reg.id} className="hover:bg-slate-50/20 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800">{reg.studentName}</span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <Mail className="h-3 w-3 shrink-0" /> {reg.studentEmail}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-slate-400">
                              {new Date(reg.registeredAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="font-mono text-[10px] bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg text-slate-500 select-all">
                                {reg.id}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex flex-col items-center justify-center gap-1">
                                <div className="flex items-center justify-center gap-1.5">
                                  {reg.status === 'attended' ? (
                                    <>
                                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Checked In
                                      </span>
                                      <button
                                        onClick={() => markAttendance(reg.id, false)}
                                        title="Revoke check-in"
                                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      className="bg-indigo-600 hover:bg-indigo-700 text-[11px] font-bold py-1 px-3"
                                      onClick={() => {
                                        markAttendance(reg.id, true);
                                        setScanSuccess({
                                          registration: reg,
                                          alreadyCheckedIn: false,
                                          message: `Check-in Confirmed! Welcome, ${reg.studentName}.`
                                        });
                                        playAudioFeedback(true);
                                      }}
                                    >
                                      Mark Attended
                                    </Button>
                                  )}
                                </div>
                                {reg.status === 'attended' && (
                                  cert ? (
                                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md flex items-center gap-1 mt-1 shrink-0">
                                      <Award className="h-3 w-3 text-indigo-500" /> Certificate Minted: {cert.verificationCode}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 mt-1 shrink-0">
                                      <Award className="h-3 w-3 text-slate-400 animate-pulse" /> Minting Pending
                                    </span>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

        </div>
      )}
    </div>
  );
};

export default CoordinatorRegistrations;
