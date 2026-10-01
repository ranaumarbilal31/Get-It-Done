import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Heart, ExternalLink, HelpCircle, Phone, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-24 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        {/* Top Brand & Trust Highlights */}
        <div className="pb-12 border-b border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Escrow Payment Protection</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Funds are secured in platform escrow upon offer acceptance and only disbursed when you approve completion.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Bank-Grade 256-Bit Security</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                All client communications, identity verification records, and transaction logs are protected with TLS 1.3 and AES-256.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Dedicated Support Desk</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Reach our team anytime at{' '}
                <a href="mailto:ranaumarbilal31@gmail.com" className="text-brand-400 hover:text-brand-300 font-semibold underline">
                  ranaumarbilal31@gmail.com
                </a>
                . Fast response in under 2 hours.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Column Main Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 text-white group">
              <img
                src="/favicon.png"
                alt="TaskConnect Logo"
                className="w-9 h-9 rounded-xl shadow-md group-hover:scale-105 transition-transform"
              />
              <div className="leading-tight">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Task<span className="text-brand-400">Connect</span>
                </span>
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                  Community Services Marketplace
                </span>
              </div>
            </Link>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              TaskConnect is the trusted on-demand community services marketplace. Posters publish everyday tasks, certified Taskers submit competitive proposals, and jobs are completed with total escrow security.
            </p>
            <div className="pt-2 text-xs text-slate-400">
              <p className="font-semibold text-slate-300">Customer Support & Escalations:</p>
              <a
                href="mailto:ranaumarbilal31@gmail.com"
                className="inline-flex items-center gap-1.5 text-brand-400 hover:text-brand-300 font-semibold mt-1 hover:underline"
              >
                <Mail className="w-3.5 h-3.5" />
                ranaumarbilal31@gmail.com
              </a>
            </div>
          </div>

          {/* Discover Col */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Discover
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/tasks" className="hover:text-white transition">
                  Browse All Tasks
                </Link>
              </li>
              <li>
                <Link to="/tasks?category=home-cleaning" className="hover:text-white transition">
                  Home Cleaning
                </Link>
              </li>
              <li>
                <Link to="/tasks?category=handyman-repairs" className="hover:text-white transition">
                  Handyman & Repairs
                </Link>
              </li>
              <li>
                <Link to="/tasks?category=furniture-assembly" className="hover:text-white transition">
                  Furniture Assembly
                </Link>
              </li>
              <li>
                <Link to="/post-task" className="text-brand-400 hover:text-brand-300 font-semibold transition">
                  Post a Task Free →
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Trust Col */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Company & Trust
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/about" className="hover:text-white transition">
                  About TaskConnect
                </Link>
              </li>
              <li>
                <Link to="/trust-safety" className="hover:text-white transition flex items-center gap-1">
                  Trust & Safety
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">Safe</span>
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition">
                  Help Center & FAQ
                </Link>
              </li>
              <li>
                <Link to="/#how-it-works" className="hover:text-white transition">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support Col */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Legal & Support
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/terms" className="hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition flex items-center gap-1 font-semibold text-slate-300">
                  Contact Us
                  <ArrowUpRight className="w-3 h-3 text-brand-400" />
                </Link>
              </li>
              <li>
                <a
                  href="mailto:ranaumarbilal31@gmail.com"
                  className="hover:text-white transition text-slate-400"
                >
                  Direct Inquiries
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 mt-4 border-t border-slate-800 text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} TaskConnect Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="hover:text-slate-300 transition">
              Terms & Conditions
            </Link>
            <Link to="/privacy" className="hover:text-slate-300 transition">
              Privacy Policy
            </Link>
            <Link to="/trust-safety" className="hover:text-slate-300 transition">
              Security
            </Link>
            <Link to="/contact" className="hover:text-slate-300 transition">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
