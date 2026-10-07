import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div>
            <span className="eyebrow">MAKE ROOM FOR WHAT MATTERS</span>
            <h2>
              Your to-do list.
              <br />A little lighter.
            </h2>
          </div>
          <Link className="button" to="/post-task">
            Let's get it done <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="footer-grid">
          <div>
            <Link to="/" className="brand">
              <img src="/brand.svg" alt="" width="36" height="36" />
              Get It Done.
            </Link>
            <p>
              Good skills meet everyday needs.
              <br />A community marketplace for local
              <br />
              help and remote projects.
            </p>
            <span className="demo-note">Demo marketplace · Payments are simulated</span>
          </div>
          <div>
            <h3>Explore</h3>
            <Link to="/tasks">Browse tasks</Link>
            <Link to="/tasks?category=home-cleaning">Cleaning tasks</Link>
            <Link to="/tasks?category=handyman-repairs">Repair tasks</Link>
            <Link to="/tasks?isRemote=true">Remote projects</Link>
            <Link to="/register">Become a tasker</Link>
          </div>
          <div>
            <h3>Good to know</h3>
            <Link to="/about">About us</Link>
            <Link to="/trust-safety">Trust & safety</Link>
            <Link to="/faq">Common questions</Link>
            <Link to="/contact">Get in touch</Link>
          </div>
          <div>
            <h3>The details</h3>
            <Link to="/terms">Terms of service</Link>
            <Link to="/privacy">Privacy policy</Link>
            <a href="https://github.com/ranaumarbilal31/Get-It-Done">
              Source on GitHub <ArrowUpRight size={13} />
            </a>
            <a href="mailto:ranaumarbilal31@gmail.com">Email support</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Get It Done</span>
          <span>Built for the things you need done.</span>
        </div>
      </div>
    </footer>
  );
}
