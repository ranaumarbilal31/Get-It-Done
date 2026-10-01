import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, ShieldCheck, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const [search, setSearch] = useState('');

  const faqs = [
    {
      category: 'For Task Posters',
      q: 'How does the TaskConnect Escrow Guarantee work?',
      a: 'When you accept an offer, your payment is pre-authorized and held safely in platform escrow. The Tasker cannot access these funds until the task is completely finished and you approve the completion. If a Tasker does not show up or complete the job, your funds are refunded in full.',
    },
    {
      category: 'For Task Posters',
      q: 'How do I choose the best Tasker for my job?',
      a: 'Review incoming bids on your task. You can click on any Tasker’s profile to inspect their star rating, number of completed jobs, verified ID badges, and authentic reviews left by previous posters.',
    },
    {
      category: 'For Task Posters',
      q: 'Can I post both in-person and remote tasks?',
      a: 'Yes! When creating a task, simply toggle the "Remote Task" switch for digital jobs (like graphic design, tech support, or translation) or use the interactive OpenStreetMap coordinate picker to specify an exact in-person job location.',
    },
    {
      category: 'For Task Posters',
      q: 'What should I do if a dispute arises?',
      a: 'If a job is not completed to the agreed specifications, do not approve completion. Use the in-app chat to request modifications. If you cannot reach an agreement, escalate the case to our 24/7 dispute mediation desk at ranaumarbilal31@gmail.com.',
    },
    {
      category: 'For Taskers',
      q: 'How and when do I get paid?',
      a: 'Once the Poster inspects and confirms job completion, the escrow funds are automatically released to your TaskConnect digital wallet. You can transfer funds directly to your linked bank account at any time.',
    },
    {
      category: 'For Taskers',
      q: 'What is the TaskConnect service fee?',
      a: 'TaskConnect retains a standard 10% platform fee from completed tasks. This fee covers secure payment processing, escrow protection, continuous server infrastructure, and round-the-clock dispute support.',
    },
    {
      category: 'For Taskers',
      q: 'How do I earn the green Verified Tasker Badge?',
      a: 'Go to your Profile settings and click "Verify Identity". Upload a clear photo of your government-issued ID (Driver License or Passport). Our moderation team reviews submissions within 24 hours to award the verified badge.',
    },
    {
      category: 'General & Security',
      q: 'Is my personal and payment data safe?',
      a: 'Yes. All network traffic is encrypted via TLS, and sensitive database records are protected with restricted access controls. Payment card processing is handled through certified payment gateways and card numbers are never stored on our servers.',
    },
    {
      category: 'General & Security',
      q: 'How do I contact customer support?',
      a: 'Our support team is ready to assist you. You can submit an inquiry through our Contact Us page or email us directly at ranaumarbilal31@gmail.com with prompt response times.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            Help Center & FAQ
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-slate-600 text-sm">
            Everything you need to know about publishing tasks, submitting bids, escrow guarantees, and account safety.
          </p>

          {/* Search Input */}
          <div className="relative mt-6 max-w-md mx-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search help topics (e.g. escrow, payouts, badges)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                      {faq.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{faq.q}</h3>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">
              No matching help articles found. Try another search term.
            </div>
          )}
        </div>

        {/* Still Have Questions Banner */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center max-w-xl mx-auto space-y-3">
          <h3 className="text-lg font-bold text-slate-900">Still have questions?</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Can't find the answer you're looking for? Reach out directly to our support specialists.
          </p>
          <div className="pt-2">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition"
            >
              <Mail className="w-4 h-4" />
              Contact Customer Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
