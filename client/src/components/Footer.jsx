import React from 'react';
import { ShieldCheck, Heart, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/favicon.png"
                alt="TaskConnect Logo"
                className="w-8 h-8 rounded-xl shadow-sm"
              />
              <span className="font-extrabold text-lg text-slate-900">
                Task<span className="text-brand-600">Connect</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              TaskConnect is a full-featured Airtasker-style task marketplace built entirely with free and open-source tools. Posters publish tasks, Taskers place bids, and work is completed with simulated escrow protection.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Free-Tier Architecture (Stripe Test Mode + Leaflet + SQLite/Postgres)</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Explore Marketplace
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><a href="/tasks" className="hover:text-brand-600">Browse All Tasks</a></li>
              <li><a href="/tasks?category=home-cleaning" className="hover:text-brand-600">Home Cleaning</a></li>
              <li><a href="/tasks?category=handyman-repairs" className="hover:text-brand-600">Handyman Services</a></li>
              <li><a href="/tasks?category=furniture-assembly" className="hover:text-brand-600">Furniture Assembly</a></li>
              <li><a href="/post-task" className="hover:text-brand-600 font-semibold text-brand-700">Post a Task for Free</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Academic & Tech Stack
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><span className="text-slate-700 font-medium">Frontend:</span> React + Vite + Tailwind</li>
              <li><span className="text-slate-700 font-medium">Backend:</span> Node + Express + Prisma</li>
              <li><span className="text-slate-700 font-medium">Real-Time:</span> Socket.IO WebSockets</li>
              <li><span className="text-slate-700 font-medium">Maps:</span> Leaflet + OpenStreetMap</li>
              <li><span className="text-slate-700 font-medium">Payments:</span> Simulated Escrow (Stripe Test)</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© {new Date().getFullYear()} TaskConnect — Built on a Student Budget of $0.</p>
          <p className="flex items-center gap-1">
            Simulated platform for academic demonstration
          </p>
        </div>
      </div>
    </footer>
  );
}
