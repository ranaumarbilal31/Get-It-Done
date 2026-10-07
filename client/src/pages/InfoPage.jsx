import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Wrench, MessageCircle, ShieldCheck } from 'lucide-react';
const content = {
  about: {
    kicker: 'PEOPLE HELPING PEOPLE',
    title: 'Life is busy. Help is here.',
    intro:
      'Get It Done connects everyday needs with practical skills. A repair, a fresh coat of paint, a digital project — start with a task and find someone who can help.',
    sections: [
      [
        'A marketplace with two sides',
        'Posters describe the work and set a budget. Taskers browse available tasks and submit offers. The poster chooses who to hire.',
      ],
      [
        'Better decisions start with details',
        'Profiles, reviews and identity submission badges provide context. They are useful signals, not guarantees of skill, credentials or safety.',
      ],
      [
        'Built to explore',
        'This is a demonstration marketplace. Payment authorization, release and wallet balances are simulated; no real money is transferred.',
      ],
    ],
  },
  safety: {
    kicker: 'BE INFORMED. STAY IN CONTROL.',
    title: 'Good connections need clear expectations.',
    intro:
      'Know what a badge means, understand the payment demonstration, and agree on the work before you begin.',
    sections: [
      [
        'Identity badges',
        'An administrator reviews an uploaded identity submission before approving a badge. A badge is not a criminal background check, trade license or quality guarantee.',
      ],
      [
        'Private conversations',
        'Task conversations are available to the poster and hired tasker. Keep sensitive information out of public descriptions and agree on the scope in your private chat.',
      ],
      [
        'Location privacy',
        'Public listings use approximate coordinates and masked street numbers. Do not place private addresses, phone numbers or access codes in public task descriptions.',
      ],
      [
        'Demo payments',
        'Accepting an offer records a simulated payment hold. Completion records a simulated payout with a 10% platform fee. Balances are demo values and cannot be withdrawn.',
      ],
      [
        'Choose thoughtfully',
        'Review the tasker’s profile, feedback and proposal. Confirm qualifications directly when needed. Report concerns through our contact form.',
      ],
    ],
  },
  faq: {
    kicker: 'A LITTLE CLARITY GOES A LONG WAY',
    title: 'Questions? Let’s get them done.',
    intro:
      'The essentials for posting tasks, finding work and using this marketplace demonstration.',
    sections: [
      [
        'How do I post a task?',
        'Open Post a task, describe the work, choose a category and budget, and select remote or in-person work. Sign in to publish your draft.',
      ],
      [
        'How do I find work?',
        'Browse tasks and filter by category, location or budget. Open a task to review its details and submit an offer while it is open.',
      ],
      [
        'When can I message someone?',
        'Private task chat becomes available to the poster and the hired tasker after an offer is accepted.',
      ],
      [
        'Are payments real?',
        'No. Payment holds, payouts and wallet balances simulate a task payment workflow. The demonstration does not charge or transfer real money.',
      ],
      [
        'What does a verified badge mean?',
        'It means an administrator approved an identity submission. It does not establish professional licensing, background checks or a guarantee of quality.',
      ],
      [
        'Can I leave a review?',
        'The poster and hired tasker can submit feedback once their task is completed. Reviews reflect user submissions.',
      ],
      [
        'How do I ask for help?',
        'Use our contact page to describe a technical problem or marketplace question. Do not send passwords or identity documents through the contact form.',
      ],
    ],
  },
  terms: {
    kicker: 'THE DETAILS THAT MATTER',
    title: 'Terms of service.',
    intro:
      'These terms describe use of the Get It Done demonstration marketplace. Review them before creating an account or publishing a task.',
    sections: [
      [
        'Using the marketplace',
        'Provide accurate account and task information. Do not publish unlawful, harmful or deceptive content, impersonate another person, or attempt to access another user’s private information.',
      ],
      [
        'Tasks and agreements',
        'Posters and taskers are responsible for agreeing on scope, timing, qualifications and safety requirements. Listings and badges do not constitute a guarantee from the platform.',
      ],
      [
        'Simulated transactions',
        'All payment holds, releases, commissions and wallet balances are demonstration records. They have no cash value and do not transfer real funds.',
      ],
      [
        'Accounts and moderation',
        'Administrators may review identity submissions and moderate account access. Keep your credentials private and contact support if you believe your account has been misused.',
      ],
      [
        'Availability and questions',
        'The demonstration may be unavailable or change. For questions about these terms, contact ranaumarbilal31@gmail.com. These terms require human legal review before commercial operation.',
      ],
    ],
  },
  privacy: {
    kicker: 'YOUR INFORMATION, EXPLAINED',
    title: 'Privacy policy.',
    intro:
      'A practical explanation of the information used by this demonstration marketplace. Contact us with questions about your data.',
    sections: [
      [
        'Account information',
        'The application stores account details, a password hash, profile information, and authentication information needed to operate your account. Do not reuse sensitive passwords on a demonstration service.',
      ],
      [
        'Public and private content',
        'Task listings and public profile fields are visible to other visitors. Messages are restricted to task participants. Public task coordinates are approximate and street numbers are masked; avoid entering sensitive details in descriptions.',
      ],
      [
        'Identity submissions',
        'Identity documents submitted for verification are intended for administrative review. Do not upload real sensitive documents when evaluating the demo; use a clearly labelled sample.',
      ],
      [
        'Service providers',
        'Hosting, database, optional storage and email services process information required by their configured integrations. Map tiles are requested from OpenStreetMap. Deployment-specific provider arrangements require operator review.',
      ],
      [
        'Your choices and requests',
        'You can update your profile in the app. Contact ranaumarbilal31@gmail.com for data access, correction or deletion requests. Do not include passwords or identity documents in an email inquiry.',
      ],
      [
        'Production review',
        'Retention periods, legal bases and jurisdiction-specific rights must be reviewed and documented by the operator before commercial launch. This page does not claim GDPR or CCPA certification.',
      ],
    ],
  },
};
export default function InfoPage({ kind }) {
  const page = content[kind];
  return (
    <div className="page-container info-page">
      <header className="info-heading">
        <span className="eyebrow">{page.kicker}</span>
        <h1>{page.title}</h1>
        <p>{page.intro}</p>
      </header>
      <div className="info-layout">
        <aside className="info-sidebar">
          <span className="category-icon">
            <ShieldCheck size={32} />
          </span>
          <h2>Know the marketplace.</h2>
          <p>Clear information helps you make better choices.</p>
          <Link to="/contact" className="text-link">
            Talk to us <ArrowUpRight size={18} />
          </Link>
        </aside>
        <div className="info-content">
          {page.sections.map(([title, text], i) =>
            kind === 'faq' ? (
              <details key={title} className="faq-item">
                <summary>
                  {title}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{text}</p>
              </details>
            ) : (
              <section key={title}>
                <span className="section-number">{String(i + 1).padStart(2, '0')}</span>
                <h2>{title}</h2>
                <p>{text}</p>
              </section>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
