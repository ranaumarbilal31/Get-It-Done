import React from 'react';
import { ShieldCheck, Lock, Eye, Database, Mail } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-200 pb-8 mb-8">
          <div className="flex items-center gap-2.5 text-brand-600 font-bold text-xs uppercase tracking-wider mb-3">
            <Lock className="w-4 h-4" />
            Data Protection & Privacy
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy & Data Safeguards
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Effective Date: October 1, 2026 • Compliant with GDPR, CCPA, and Global Consumer Privacy Frameworks
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none text-sm text-slate-700 space-y-8 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              1. Overview & Commitment to Privacy
            </h2>
            <p>
              TaskConnect Technologies Inc. ("TaskConnect", "we", "us") values your privacy. We are committed to safeguarding personal information collected through our on-demand services marketplace with enterprise-grade encryption and strict access boundaries.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              2. Information We Collect
            </h2>
            <p>To operate our marketplace and ensure safety, we collect:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>
                <strong>Profile & Authentication Data:</strong> Your name, email address, encrypted password hash, bio, contact details, and avatar.
              </li>
              <li>
                <strong>Task & Geolocation Data:</strong> Listing titles, task descriptions, budgets, attached photos, and approximate map coordinates for task routing.
              </li>
              <li>
                <strong>Identity Verification Documents (KYC):</strong> Government-issued photo IDs (driver licenses, passports) submitted by Taskers seeking the Verified Tasker badge.
              </li>
              <li>
                <strong>Financial & Escrow Records:</strong> Transaction histories, wallet balances, and tokenized payment records via Stripe. <em>(Note: We never store full credit card numbers on our servers)</em>.
              </li>
              <li>
                <strong>Communications & Chat Logs:</strong> In-app messages, negotiation history, and mutual ratings between Posters and Taskers.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              3. Data Encryption & Security Standards
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  TLS 1.3 in Transit
                </div>
                <p className="text-xs text-slate-500">
                  All communications between client devices, APIs, and WebSockets servers are encrypted using modern TLS cryptographic handshakes.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <Database className="w-4 h-4 text-brand-600" />
                  Encrypted Cloud Storage
                </div>
                <p className="text-xs text-slate-500">
                  Identity documents, database records, and transaction logs are protected with cloud storage encryption and strict role-based access controls.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              4. How We Use and Share Information
            </h2>
            <p>
              We only share your information when strictly necessary to facilitate marketplace transactions:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Between Posters & Taskers:</strong> To coordinate tasks and chat directly once an offer is accepted.</li>
              <li><strong>Payment Processors:</strong> With certified banking and escrow gateways (e.g. Stripe) to pre-authorize and disburse funds.</li>
              <li><strong>Zero Sale of Data:</strong> <strong>We never sell, rent, or monetize your personal information or browsing history to third-party data brokers or advertisers.</strong></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              5. Your Legal Rights (GDPR & CCPA)
            </h2>
            <p>
              You have the right to request access to your stored personal data, request corrections, or exercise your "Right to be Forgotten" by requesting complete account and KYC document deletion.
            </p>
            <p>
              To submit a data access or deletion request, please email our Data Protection Officer below. Requests are processed within 14 calendar days.
            </p>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              6. Contact Our Data Protection Team
            </h2>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
              <p><strong>Data Protection Officer:</strong> TaskConnect Privacy & Compliance</p>
              <p className="mt-1">
                <strong>Inquiries & Deletion Requests:</strong>{' '}
                <a href="mailto:ranaumarbilal31@gmail.com" className="text-brand-600 font-semibold hover:underline">
                  ranaumarbilal31@gmail.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
