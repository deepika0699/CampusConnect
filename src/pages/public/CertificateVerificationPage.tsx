import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ShieldCheck, ShieldAlert, Copy, Check, Award, Calendar, Landmark, User, BookOpen, Clock } from 'lucide-react';

interface VerifiedCert {
  valid: boolean;
  studentName: string;
  eventTitle: string;
  collegeName: string;
  department: string;
  issuedAt: string;
  verificationCode: string;
  verificationTimestamp: string;
}

export const CertificateVerificationPage: React.FC = () => {
  const { currentPath, navigateTo } = useApp();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<VerifiedCert | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Extract ID from path like /verify/CC-VERT-XXXXXX
  const getVerificationCode = () => {
    const parts = currentPath.split('?')[0].split('/');
    return parts[parts.length - 1] || '';
  };

  const code = getVerificationCode();

  useEffect(() => {
    if (!code) {
      setError('No verification code provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/verify/${code}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Certificate Not Found / Invalid');
        }
        return res.json();
      })
      .then((data) => {
        setCert(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Verification failed');
        setCert(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [code]);

  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Institution Header Branding */}
      <div className="mb-8 text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full shadow-xs">
          <Award className="h-5 w-5 text-indigo-600 animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-widest">CampusConnect Verification Node</span>
        </div>
        <h1 className="text-xl font-black text-slate-800 tracking-tight">Academic Registry Portal</h1>
        <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
          Instant, decentralized check-in and certificate authentication for inter-collegiate events.
        </p>
      </div>

      {loading ? (
        <Card className="w-full max-w-md p-10 text-center space-y-4 bg-white border border-slate-100 rounded-3xl shadow-md">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Querying Secure Registry...</p>
        </Card>
      ) : error ? (
        <Card className="w-full max-w-md p-8 text-center bg-white border border-rose-100 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100 mb-4">
            <ShieldAlert className="h-9 w-9" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Verification Failed</h2>
          <p className="text-xs text-rose-600 font-semibold mt-1">Invalid or Unknown Credential</p>
          
          <div className="my-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left space-y-2 font-medium">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Details</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              The verification code <span className="font-mono text-slate-800 font-bold bg-slate-100 px-1 py-0.5 rounded">{code}</span> could not be authenticated against our active academic registry.
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" size="sm" onClick={() => navigateTo('/')}>
              Go to Home
            </Button>
            <Button variant="primary" size="sm" className="bg-slate-800 hover:bg-slate-900" onClick={() => navigateTo('/events')}>
              Explore Events
            </Button>
          </div>
        </Card>
      ) : cert ? (
        <Card className="w-full max-w-lg p-8 bg-white border border-emerald-100 rounded-3xl shadow-xl relative overflow-hidden space-y-6">
          {/* Certificate Top Highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />

          {/* Verification Status Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div className="text-left">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Decentralized Badge Verified</h2>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Authentic Academic Credential</p>
              </div>
            </div>
            <div className="text-right sm:text-right text-[10px] text-slate-400 font-semibold bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl">
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Verified Timestamp</span>
              <span className="font-mono text-slate-600">{new Date(cert.verificationTimestamp).toLocaleString()}</span>
            </div>
          </div>

          {/* Certificate Main Metadata Body */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metadata payload</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100/60 rounded-2xl flex items-start gap-3">
                <User className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Student Name</span>
                  <span className="text-xs font-extrabold text-slate-800 uppercase">{cert.studentName}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100/60 rounded-2xl flex items-start gap-3">
                <Landmark className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">College Institution</span>
                  <span className="text-xs font-extrabold text-slate-800 uppercase">{cert.collegeName}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100/60 rounded-2xl flex items-start gap-3">
                <BookOpen className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Event Title</span>
                  <span className="text-xs font-extrabold text-slate-800 uppercase leading-snug">{cert.eventTitle}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100/60 rounded-2xl flex items-start gap-3">
                <Calendar className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Issue Date</span>
                  <span className="text-xs font-extrabold text-slate-800 uppercase">{new Date(cert.issuedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100/60 rounded-2xl flex items-start gap-3">
              <Award className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Academic Department</span>
                <span className="text-xs font-extrabold text-slate-800 uppercase">{cert.department}</span>
              </div>
            </div>
          </div>

          {/* Secure Registry Code Block */}
          <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">SECURE REGISTRY IDENTIFIER</span>
              <span className="text-emerald-400 font-bold text-xs sm:text-sm">{cert.verificationCode}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyCode}
              className="text-slate-300 hover:text-white hover:bg-slate-800 bg-slate-800/40 border border-slate-700 text-xs px-3.5 py-1.5 flex items-center gap-1.5 font-sans"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" /> Copy Code
                </>
              )}
            </Button>
          </div>

          {/* Back Home Button */}
          <div className="pt-2 text-center">
            <Button variant="outline" size="sm" onClick={() => navigateTo('/')}>
              Return to CampusConnect Homepage
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
};

export default CertificateVerificationPage;
