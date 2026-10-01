import React from 'react';
import { ShieldCheck, Users, Sparkles, TrendingUp, Award, Heart, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Our Mission & Story
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            Redefining How Local Services Get Done
          </h1>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            TaskConnect was founded on a simple principle: getting quality help for your home, office, or digital business should be fast, transparent, and completely safe.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">100% Escrow Protection</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Posters never risk losing their money upfront, and Taskers are guaranteed compensation upon completing the job. Funds are securely locked in escrow until both parties are satisfied.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Vetted Identity Badges</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              We vet government identity documents to award the Verified Tasker badge, giving clients peace of mind and trusted credibility.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Fair, Open Bidding</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              No hidden markups or algorithmic price gouging. Taskers submit transparent proposals, allowing Posters to choose the best fit for their budget and timeline.
            </p>
          </div>
        </div>

        {/* Platform Numbers / Impact */}
        <div className="bg-slate-900 text-white rounded-3xl p-10 sm:p-14 shadow-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-brand-400">99.8%</div>
              <div className="text-xs uppercase tracking-wider text-slate-400 mt-1 font-semibold">Job Satisfaction</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-teal-400">&lt; 15 min</div>
              <div className="text-xs uppercase tracking-wider text-slate-400 mt-1 font-semibold">Average First Bid</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-amber-400">$0 Risk</div>
              <div className="text-xs uppercase tracking-wider text-slate-400 mt-1 font-semibold">Escrow Guarantee</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400">24/7</div>
              <div className="text-xs uppercase tracking-wider text-slate-400 mt-1 font-semibold">Live Monitoring</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white rounded-2xl p-10 border border-slate-200/80 shadow-sm max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Ready to Experience TaskConnect?</h2>
          <p className="text-sm text-slate-600">
            Join thousands of posters getting tasks completed, or become an approved tasker and start earning today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/post-task"
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition"
            >
              Post a Task
            </Link>
            <Link
              to="/tasks"
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition"
            >
              Browse Open Gigs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
