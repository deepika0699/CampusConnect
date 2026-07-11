import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Award, Share2, Download, Printer, ShieldCheck, User, Calendar, BookOpen, Clock } from 'lucide-react';
import { Certificate } from '../../types';

export const StudentCertificates: React.FC = () => {
  const { currentUser, certificates } = useApp();
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  if (!currentUser) return null;

  const studentCerts = certificates.filter(c => c.studentId === currentUser.id);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 py-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Verifiable Academic Certificates</h1>
        <p className="text-xs text-slate-400 font-semibold">Download cryptographically verifiable credentials for attended events.</p>
      </div>

      {studentCerts.length === 0 ? (
        <Card className="p-10 text-center text-slate-400">
          <Award className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold">No credentials issued yet</p>
          <p className="text-xs text-slate-400 mt-1">Once you check-in and attend an event, your certificate is minted instantly.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studentCerts.map((cert) => (
            <Card 
              key={cert.id} 
              hoverable 
              className="p-5 bg-white border border-slate-150 rounded-3xl shadow-sm flex flex-col justify-between h-48 cursor-pointer relative overflow-hidden group hover:border-indigo-400"
              onClick={() => setSelectedCert(cert)}
            >
              {/* Background vector */}
              <div className="absolute right-0 bottom-0 h-20 w-20 text-indigo-50/20 translate-x-3 translate-y-3 shrink-0 pointer-events-none transition-transform duration-300 group-hover:scale-110">
                <Award className="h-full w-full" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{cert.department}</span>
                <h3 className="text-sm font-extrabold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{cert.eventTitle}</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">ID: <span className="font-mono text-slate-500">{cert.id}</span></p>
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold">Issued {new Date(cert.issuedAt).toLocaleDateString()}</span>
                <Button variant="outline" size="sm">
                  View Badge
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Certificate Viewer Modal */}
      <Modal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        title="Verified Participation Badge"
        size="lg"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="h-4 w-4" />}
              onClick={handlePrint}
            >
              Print / Save PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Share2 className="h-4 w-4" />}
              onClick={() => {
                alert(`Shareable Verification URL: https://campusconnect.edu/verify/${selectedCert?.verificationCode}`);
              }}
            >
              Share Credential
            </Button>
          </div>
        }
      >
        {selectedCert && (
          <div className="p-2 sm:p-6 bg-amber-50/20 rounded-3xl border border-amber-100 flex flex-col gap-8 text-center relative overflow-hidden print:bg-white print:border-none print:shadow-none">
            {/* Elegant watermark decoration */}
            <div className="absolute inset-0 bg-radial-gradient from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
            
            {/* Header design */}
            <div className="space-y-2 pb-4 border-b border-amber-100/40 relative z-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-indigo-600 border border-amber-100">
                <Award className="h-8 w-8 animate-pulse" />
              </div>
              <h2 className="text-sm font-extrabold text-indigo-900 tracking-widest uppercase">CampusConnect Academic Registry</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">State-Accredited Student Development Framework</p>
            </div>

            {/* Content body */}
            <div className="space-y-6 relative z-10">
              <span className="text-xs italic text-slate-500 block font-serif">This is to certify that</span>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{selectedCert.studentName}</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                has successfully and actively participated in the academic campus event entitled
              </p>
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{selectedCert.eventTitle}</h4>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">
                held on {new Date(selectedCert.eventDate).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Validation signatures & codes footer */}
            <div className="grid grid-cols-2 gap-8 border-t border-amber-100/40 pt-6 relative z-10 text-[10px]">
              {/* Left validation code block */}
              <div className="text-left space-y-1 bg-white p-3 rounded-2xl border border-slate-100 font-mono">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Verification Code</span>
                <span className="text-emerald-600 font-bold text-xs">{selectedCert.verificationCode}</span>
                <span className="text-[8px] text-slate-400 block mt-1 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" /> SECURE BLOCK METADATA
                </span>
              </div>

              {/* Right authority signature block */}
              <div className="text-right space-y-2 pr-2">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Issuing Authority</span>
                {/* Simulated signature graphic */}
                <div className="h-6 flex items-center justify-end">
                  <span className="text-xs font-serif font-bold italic tracking-wide text-indigo-700/60 border-b border-indigo-200/50 pb-1 px-4 select-none">
                    {selectedCert.coordinatorName}
                  </span>
                </div>
                <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">{selectedCert.department} Coordinator</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default StudentCertificates;
