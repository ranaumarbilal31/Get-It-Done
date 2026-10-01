import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, UserCheck, MessageSquare, AlertTriangle, Scale, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TrustSafetyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-14">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            Trust, Safety & Security Center
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            Your Safety & Peace of Mind Come First
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            From encrypted payment escrow to government identity verification, discover the multi-layered protections safeguarding every task.
          </p>
        </div>

        {/* 4 Core Safety Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">TaskConnect Escrow Guarantee</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              When an offer is accepted, the Poster’s payment is pre-authorized and locked safely in platform escrow. Money is only transferred to the Tasker’s wallet when the Poster confirms the job is completed to satisfaction.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Zero upfront cash risk for Posters • Guaranteed payout for Taskers</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Government ID Verification (KYC)</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Taskers can upload official government-issued photo identification (Driver's License, Passport). Our compliance officers inspect documents before awarding the green <strong>Verified Tasker Badge</strong>.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Certified identity verification records encrypted with AES-256</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Protected In-App Messaging</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Communicate in real time with end-to-end task chat channels. Keeps phone numbers private, ensures instant job coordination, and maintains a secure audit trail should mediation ever be required.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Real-time Socket.IO chat with unread message notifications</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Dedicated Dispute Mediation</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              In the unlikely event of an incomplete task or disagreement, our dispute resolution team reviews the agreement, communication logs, and uploaded evidence to issue fair, binding resolutions.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Live mediation support reachable at ranaumarbilal31@gmail.com</span>
            </div>
          </div>
        </div>

        {/* Contact Banner */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Need Immediate Safety Support?</h3>
            <p className="text-sm text-slate-500 mt-1">
              Our Trust & Safety response team is standing by 24/7 for urgent escalations.
            </p>
          </div>
          <Link
            to="/contact"
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition whitespace-nowrap"
          >
            Contact Safety Team
          </Link>
        </div>
      </div>
    </div>
  );
}
