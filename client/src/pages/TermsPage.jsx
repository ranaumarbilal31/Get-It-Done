import React from 'react';
import { Shield, FileText, CheckCircle, AlertTriangle, Scale, Mail } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-200 pb-8 mb-8">
          <div className="flex items-center gap-2.5 text-brand-600 font-bold text-xs uppercase tracking-wider mb-3">
            <FileText className="w-4 h-4" />
            Legal Documentation
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Terms of Service & Marketplace Agreement
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Last Updated & Effective: October 1, 2026 • Version 2.0 (Commercial Production Edition)
          </p>
        </div>

        {/* Legal Text Content */}
        <div className="prose prose-slate max-w-none text-sm text-slate-700 space-y-8 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              1. Introduction & Acceptance of Terms
            </h2>
            <p>
              Welcome to <strong>Get It Done</strong> ("Get It Done," "Platform," "we," "our," or "us"). These Terms of Service constitute a legally binding agreement between you and Get It Done Technologies Inc. governing your access to and use of the Get It Done website, mobile applications, APIs, and associated services.
            </p>
            <p>
              By creating an account, browsing listings, publishing a task, or submitting an offer, you explicitly represent that you are at least 18 years of age and legally competent to enter into binding contracts. If you do not agree to these Terms, you must immediately discontinue use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              2. Marketplace Model & Independent Contractor Relationship
            </h2>
            <p>
              Get It Done operates as an <strong>on-demand, two-sided technology marketplace</strong> connecting independent individuals seeking assistance with projects ("Posters") and certified independent contractors or service providers ("Taskers").
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2 text-slate-600">
              <li>Taskers are independent contractors, not employees, partners, agents, or joint venturers of Get It Done.</li>
              <li>Taskers retain full autonomy to determine their work schedules, pricing proposals, methods, tools, and execution of services.</li>
              <li>A direct contractual agreement is created solely between the Poster and the Tasker upon the formal acceptance of an offer on the Platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              3. User Accounts, Trust & Identity Verification (KYC)
            </h2>
            <p>
              To maintain the integrity of our marketplace, users must provide accurate, current, and verifiable information during registration. Users are solely responsible for safeguarding their login credentials.
            </p>
            <p>
              Taskers may apply for the <strong>Verified Tasker Badge</strong> by submitting government-issued photo identification. Our trust and safety moderation team verifies documents in accordance with international identity verification standards. Submitting forged or misleading credentials will result in immediate permanent account termination and referral to relevant legal authorities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              4. Payment Protection, Escrow Engine & Platform Fees
            </h2>
            <p>
              To protect both parties against fraud and non-payment, Get It Done incorporates an automated <strong>Escrow Payment Guarantee</strong>:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 mt-3">
              <p className="font-semibold text-slate-900">How Escrow Protection Operates:</p>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-600 text-xs">
                <li><strong>Pre-Authorization:</strong> When a Poster accepts an offer, the agreed task budget is pre-authorized via encrypted payment gateway and locked securely in platform escrow.</li>
                <li><strong>Safe Execution:</strong> Funds remain securely held during the performance of the task. The Tasker is protected against non-payment.</li>
                <li><strong>Release Upon Approval:</strong> Once the Poster inspects and confirms satisfactory completion, the escrow funds are released directly to the Tasker’s digital wallet.</li>
                <li><strong>Service Fee:</strong> Get It Done retains a standard marketplace commission fee (10%) from the gross payout to cover payment gateway infrastructure, hosting, real-time messaging, and fraud prevention.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              5. Cancellations, Modifications & Dispute Mediation
            </h2>
            <p>
              Either party may request cancellation before work commences. If both parties agree to cancel, or if a Tasker fails to arrive or perform, escrow funds will be fully refunded to the Poster's original payment method.
            </p>
            <p>
              In the rare event of an unresolvable dispute regarding task quality or completion, either party may escalate to <strong>Get It Done Dispute Resolution</strong>. Our dedicated mediation officers will review chat logs, uploaded task photos, and contractual terms to issue a binding, impartial settlement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              6. Prohibited Tasks & Community Guidelines
            </h2>
            <p>
              Users are strictly prohibited from posting, bidding on, or coordinating tasks that:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Violate municipal, federal, or international laws.</li>
              <li>Involve dangerous, hazardous, or illicit substances.</li>
              <li>Require regulated medical, electrical, or plumbing licenses without active certifications.</li>
              <li>Attempt to circumvent the platform to avoid escrow protection or marketplace fees.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              7. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, Get It Done Technologies Inc. shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from any user's conduct, property damage, or services performed by independent Taskers.
            </p>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              8. Contact Legal & Compliance
            </h2>
            <p className="text-slate-600">
              For legal notices, terms inquiries, or formal dispute communications, please direct communications to:
            </p>
            <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
              <p><strong>Legal & Corporate Affairs:</strong> Get It Done Technologies Inc.</p>
              <p className="mt-1">
                <strong>Official Contact Email:</strong>{' '}
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
