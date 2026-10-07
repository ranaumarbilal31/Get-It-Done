import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
const content = {
  about: {
    kicker: 'PEOPLE HELPING PEOPLE',
    title: 'Life is busy. Help is here.',
    intro:
      'Connect everyday needs with practical skills. Start with a clear task and find someone who can help.',
    sections: [
      [
        'A marketplace with two sides',
        'Jobbers describe work and fund a task. Taskers submit offers. The jobber chooses who to hire.',
      ],
      [
        'Choose with confidence',
        'Read profiles, compare proposals and review feedback from completed tasks. Agree on qualifications and scope before hiring.',
      ],
      [
        'From brief to delivery',
        'Keep your conversation and delivery evidence in the task. Review the result before approving payment.',
      ],
    ],
  },
  how: {
    kicker: 'LESS HASSLE. MORE POSSIBILITY.',
    title: 'From your list to done.',
    intro: 'One place to describe the work, choose your tasker and follow delivery.',
    sections: [
      [
        'Describe and fund',
        'Create a task with a clear description, category, location and budget. Review the total before funding and publishing.',
      ],
      [
        'Compare and choose',
        'Read proposals and profiles. If the chosen offer changes the price, review and settle the difference before hiring.',
      ],
      [
        'Deliver and approve',
        'Your tasker submits the work. Approve delivery to release payment and credit their account.',
      ],
      [
        'If something goes wrong',
        'Open a dispute and share evidence. Funds stay held while the platform reviews both sides and decides the outcome.',
      ],
    ],
  },
  safety: {
    kicker: 'BE INFORMED. STAY IN CONTROL.',
    title: 'Clear expectations make better connections.',
    intro: 'Agree on scope, understand profile signals and keep a record of your work.',
    sections: [
      [
        'Identity badges',
        'A badge means an administrator approved an identity submission. It does not establish a criminal background check, professional license or guarantee of quality.',
      ],
      [
        'Private conversations',
        'Task conversations are restricted to the jobber and hired tasker. Keep passwords, access codes and private contact details out of public descriptions.',
      ],
      [
        'Location privacy',
        'Public listings show approximate coordinates and mask street numbers. Only authorized participants can see the task’s full location.',
      ],
      [
        'Review and resolution',
        'Review delivered work before approval. If you disagree, open a dispute and submit evidence so the platform can decide how to settle the held payment.',
      ],
    ],
  },
  payments: {
    kicker: 'KNOW YOUR TASK PAYMENT',
    title: 'Clear payments. Clear next steps.',
    intro:
      'Review your payment breakdown before committing, and follow every recorded movement in your account.',
    sections: [
      [
        'Fund before publication',
        'The jobber funds the agreed task price plus a $1 connection fee. A task is published after funding succeeds.',
      ],
      [
        'Tasker charges',
        'A $1 tasker connection fee is deducted first. The service fee applies to the remaining amount: 2% for task prices below $50, 4% for $50–$99.99, and 5% for $100 or more. The original agreed price determines the tier.',
      ],
      [
        'An example',
        'For a $10 task, the jobber total is $11. The tasker receives $8.82 after the $1 connection fee and 2% of the remaining $9. Prices and fees are in USD.',
      ],
      [
        'Approval and account history',
        'After delivery, the jobber approves the work and the tasker’s net payment appears in their account. No disputed payment is automatically released.',
      ],
      [
        'Cancellations and refunds',
        'Before hiring, cancellation returns all held funds and waives fees. After hiring, request platform review. A full refund waives all fees; partial settlement refunds the unused task price and applies tasker charges to the awarded amount.',
      ],
    ],
  },
  disputes: {
    kicker: 'BOTH SIDES DESERVE TO BE HEARD',
    title: 'Dispute resolution.',
    intro:
      'When the tasker says the work is complete and the jobber disagrees, the platform reviews the evidence and decides the outcome.',
    sections: [
      [
        'Raise the concern',
        'Either hired participant can open a dispute before payment is released. Explain the disagreement and what resolution you are requesting.',
      ],
      [
        'Funds remain held',
        'Opening a dispute freezes payment. Neither participant can release or refund it while review is open.',
      ],
      [
        'Share your evidence',
        'Both participants may provide delivery details, links, messages and a written response. Include relevant evidence and avoid sensitive information that is unrelated to the task.',
      ],
      [
        'Platform decision',
        'An authorized administrator reviews the task agreement and both sides’ evidence. The platform may release the full payment, refund all held funds, or split the task amount. A written decision is recorded with the settlement.',
      ],
      [
        'Partial settlements',
        'The unused task amount is returned to the jobber. The tasker connection fee is applied once, capped to the award, and the snapshotted percentage applies after that deduction. No negative tasker payout is created.',
      ],
    ],
  },
  faq: {
    kicker: 'A LITTLE CLARITY GOES A LONG WAY',
    title: 'Questions? Let’s get them done.',
    intro: 'The essentials for posting tasks, finding work and receiving delivery.',
    sections: [
      [
        'How do I post a task?',
        'Describe your task, set a budget and fund it to publish. Compare offers and choose your tasker.',
      ],
      [
        'How do I find work?',
        'Browse available tasks, filter by category or budget and send an offer with your approach.',
      ],
      ['When can I message someone?', 'Private task chat opens after the jobber accepts an offer.'],
      [
        'How does payment release work?',
        'The tasker delivers work, then the jobber reviews and approves it. The net amount appears in the tasker’s account.',
      ],
      [
        'What if we disagree?',
        'Open a dispute and share evidence. Funds remain held until the platform decides whether to release, refund or split them.',
      ],
      [
        'How do I activate my account?',
        'Follow the activation email. If the link expires, request a replacement from the login page.',
      ],
      [
        'Can I leave a review?',
        'The jobber can review their hired tasker after the task is completed.',
      ],
      [
        'How do I get help?',
        'Use the contact form. Never send passwords or identity documents in a support inquiry.',
      ],
    ],
  },
  terms: {
    kicker: 'THE DETAILS THAT MATTER',
    title: 'Terms of service.',
    intro: 'Review these terms before creating an account, publishing a task or accepting work.',
    sections: [
      [
        'Marketplace use',
        'Provide accurate information. Do not publish unlawful or deceptive content, impersonate others or access private information without authorization.',
      ],
      [
        'Task agreements',
        'Jobbers and taskers agree on scope, timing, qualifications and safety requirements. Listings and identity badges do not guarantee professional licensing or work quality.',
      ],
      [
        'Payment charges',
        'The jobber pays the agreed task price plus $1. The tasker pays $1 plus a percentage of the remaining amount: 2% below $50, 4% for $50–$99.99 and 5% from $100. The original price determines the tier. Review the transaction breakdown before committing.',
      ],
      [
        'Delivery and disputes',
        'Payment release requires jobber approval after delivery. Disputes freeze funds for platform review. The administrator may release, refund or split the payment, with a recorded reason. Read the dispute policy for settlement details.',
      ],
      [
        'Accounts and moderation',
        'Keep credentials private. Administrators review identity submissions and may moderate inappropriate content and account access.',
      ],
      ['Contact', 'Send questions through the contact page or email phalanx.getitdone@gmail.com.'],
    ],
  },
  privacy: {
    kicker: 'YOUR INFORMATION, EXPLAINED',
    title: 'Privacy policy.',
    intro: 'How account information, task content and marketplace records are used.',
    sections: [
      [
        'Account information',
        'We store account details, password hashes and profile information needed to operate your account. Activation and password recovery use single-use, expiring links.',
      ],
      [
        'Public and private content',
        'Task listings and public profile fields are visible to visitors. Task messages and delivery records are restricted to authorized participants; disputes are also accessible to authorized administrators.',
      ],
      [
        'Identity submissions',
        'Identity documents are restricted to administrative review. Do not include documents in task descriptions or support inquiries.',
      ],
      [
        'Service providers',
        'Hosting, databases, configured storage and account-email services process information needed to provide the application. Map tiles are requested from OpenStreetMap.',
      ],
      [
        'Financial records',
        'Task agreements, fee breakdowns, payment activity and dispute decisions are recorded to maintain account history and prevent repeated settlement.',
      ],
      [
        'Your choices',
        'Update your profile in your account. Contact phalanx.getitdone@gmail.com for access, correction or deletion requests. Never include passwords or identity documents in an email inquiry.',
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
