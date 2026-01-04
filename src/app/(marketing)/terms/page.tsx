'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Gamepad2, ArrowLeft, ChevronRight, Menu, X, FileText } from 'lucide-react';

const sections = [
  { id: 'acceptance', title: 'Acceptance of Terms', number: '01' },
  { id: 'accounts', title: 'User Accounts', number: '02' },
  { id: 'integrations', title: 'Platform Integrations', number: '03' },
  { id: 'conduct', title: 'User Conduct', number: '04' },
  { id: 'intellectual-property', title: 'Intellectual Property', number: '05' },
  { id: 'disclaimers', title: 'Disclaimers & Limitations', number: '06' },
  { id: 'termination', title: 'Termination', number: '07' },
  { id: 'changes', title: 'Changes to Terms', number: '08' },
  { id: 'contact', title: 'Contact Information', number: '09' },
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('acceptance');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);

      // Update active section based on scroll position
      const sectionElements = sections.map(s => document.getElementById(s.id));
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el && el.getBoundingClientRect().top <= 150) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-theme-primary text-theme-primary">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-border z-50">
        <div
          className="h-full bg-linear-to-r from-cyan-500 to-violet-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0.5 left-0 right-0 z-40 bg-theme-primary/90 backdrop-blur-xl border-b border-theme">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-linear-to-br from-cyan-500 to-violet-600 rounded-lg flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-l border-t border-cyan-400/50" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-r border-t border-cyan-400/50" />
                <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-l border-b border-cyan-400/50" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-r border-b border-cyan-400/50" />
              </div>
              <span className="text-lg font-semibold tracking-wide font-family-display">
                GAMEHUB
              </span>
            </Link>

            <div className="flex items-center gap-4">
              {/* Mobile TOC Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg border border-theme bg-theme-hover"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-sm text-theme-muted hover:text-accent-cyan border border-theme hover:border-accent-cyan/50 rounded-lg bg-theme-hover transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Return</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile TOC Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-20 left-4 right-4 bg-theme-secondary border border-theme rounded-xl p-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-theme">
              <FileText className="w-4 h-4 text-accent-cyan" />
              <span className="text-xs font-mono text-theme-muted uppercase tracking-wider">Table of Contents</span>
            </div>
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                    activeSection === section.id
                      ? 'bg-accent-cyan/10 text-accent-cyan'
                      : 'text-theme-muted hover:bg-theme-hover'
                  }`}
                >
                  <span className="text-xs font-mono opacity-50">{section.number}</span>
                  <span className="text-sm">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-12">
            {/* Desktop Sidebar TOC */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <div className="relative">
                  {/* HUD Frame */}
                  <div className="absolute -inset-3">
                    <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400/30" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400/30" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400/30" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-400/30" />
                  </div>

                  <div className="bg-theme-secondary/50 backdrop-blur-sm border border-theme rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-5 pb-4 border-b border-theme">
                      <FileText className="w-4 h-4 text-accent-cyan" />
                      <span className="text-[10px] font-mono text-accent-cyan uppercase tracking-wider">
                        // CONTENTS
                      </span>
                    </div>
                    <nav className="space-y-1">
                      {sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => scrollToSection(section.id)}
                          className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-300 ${
                            activeSection === section.id
                              ? 'bg-accent-cyan/10 border border-accent-cyan/30'
                              : 'hover:bg-theme-hover border border-transparent'
                          }`}
                        >
                          <span className={`text-xs font-mono transition-colors ${
                            activeSection === section.id
                              ? 'text-accent-cyan'
                              : 'text-theme-subtle group-hover:text-theme-muted'
                          }`}>
                            {section.number}
                          </span>
                          <span className={`text-sm transition-colors ${
                            activeSection === section.id
                              ? 'text-accent-cyan'
                              : 'text-theme-muted group-hover:text-theme-primary'
                          }`}>
                            {section.title}
                          </span>
                          {activeSection === section.id && (
                            <ChevronRight className="w-4 h-4 ml-auto text-accent-cyan" />
                          )}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            </aside>

            {/* Content */}
            <main ref={contentRef}>
              {/* Hero */}
              <div className={`mb-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 max-w-12 bg-linear-to-r from-transparent to-accent-cyan" />
                  <span className="text-[10px] font-mono text-accent-cyan uppercase tracking-wider">
                    // LEGAL_PROTOCOL
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold font-family-display tracking-tight mb-4">
                  Terms of Service
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-theme-muted">
                  <span className="font-mono">Last Updated: December 2024</span>
                  <span className="w-1 h-1 rounded-full bg-text-subtle" />
                  <span className="font-mono">Version 1.0</span>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-16">
                {/* Section 1 */}
                <section id="acceptance" className="scroll-mt-32">
                  <SectionHeader number="01" title="Acceptance of Terms" />
                  <div className="prose-custom">
                    <p>
                      Welcome to GameHub. By accessing or using our platform, you agree to be bound by these Terms of Service
                      (&quot;Terms&quot;). If you do not agree to these Terms, please do not use our services.
                    </p>
                    <p>
                      These Terms constitute a legally binding agreement between you and GameHub regarding your use of our
                      game library aggregation platform. We reserve the right to modify these Terms at any time, and your
                      continued use of the platform constitutes acceptance of any modifications.
                    </p>
                    <div className="callout">
                      <strong>Important:</strong> By creating an account, you confirm that you are at least 13 years of age
                      and have the legal capacity to enter into this agreement.
                    </div>
                  </div>
                </section>

                {/* Section 2 */}
                <section id="accounts" className="scroll-mt-32">
                  <SectionHeader number="02" title="User Accounts" />
                  <div className="prose-custom">
                    <p>
                      To access certain features of GameHub, you must create an account. You are responsible for:
                    </p>
                    <ul>
                      <li>Maintaining the confidentiality of your account credentials</li>
                      <li>All activities that occur under your account</li>
                      <li>Providing accurate and complete registration information</li>
                      <li>Promptly updating your information if it changes</li>
                    </ul>
                    <p>
                      You agree to notify us immediately of any unauthorized access to your account. GameHub will not be
                      liable for any loss or damage arising from your failure to protect your account credentials.
                    </p>
                  </div>
                </section>

                {/* Section 3 */}
                <section id="integrations" className="scroll-mt-32">
                  <SectionHeader number="03" title="Platform Integrations" />
                  <div className="prose-custom">
                    <p>
                      GameHub integrates with various third-party gaming platforms to aggregate your game library.
                      These integrations include, but are not limited to:
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3 my-6">
                      {['Steam', 'PlayStation Network', 'Xbox Live', 'Epic Games Store', 'Nintendo', 'GOG'].map((platform) => (
                        <div key={platform} className="flex items-center gap-3 px-4 py-3 bg-theme-hover border border-theme rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-accent-cyan" />
                          <span className="text-sm">{platform}</span>
                        </div>
                      ))}
                    </div>
                    <p>
                      By connecting your accounts, you authorize GameHub to access and display your game library data,
                      achievements, playtime, and related information. Each platform integration is subject to that
                      platform&apos;s own terms of service and privacy policies.
                    </p>
                    <div className="callout">
                      <strong>Note:</strong> GameHub does not store your gaming platform passwords. We use secure OAuth
                      authentication where available.
                    </div>
                  </div>
                </section>

                {/* Section 4 */}
                <section id="conduct" className="scroll-mt-32">
                  <SectionHeader number="04" title="User Conduct" />
                  <div className="prose-custom">
                    <p>When using GameHub, you agree not to:</p>
                    <ul>
                      <li>Violate any applicable laws or regulations</li>
                      <li>Infringe upon the rights of others</li>
                      <li>Attempt to gain unauthorized access to our systems</li>
                      <li>Use automated tools to scrape or collect data</li>
                      <li>Interfere with the proper functioning of the platform</li>
                      <li>Upload malicious code or attempt to compromise security</li>
                      <li>Impersonate others or provide false information</li>
                      <li>Use the service for commercial purposes without authorization</li>
                    </ul>
                    <p>
                      Violation of these conduct guidelines may result in immediate termination of your account and
                      potential legal action.
                    </p>
                  </div>
                </section>

                {/* Section 5 */}
                <section id="intellectual-property" className="scroll-mt-32">
                  <SectionHeader number="05" title="Intellectual Property" />
                  <div className="prose-custom">
                    <p>
                      All content, features, and functionality of GameHub—including but not limited to text, graphics,
                      logos, icons, and software—are the exclusive property of GameHub or its licensors and are protected
                      by copyright, trademark, and other intellectual property laws.
                    </p>
                    <p>
                      Game titles, artwork, and related content displayed on our platform remain the property of their
                      respective owners. GameHub&apos;s display of this content does not transfer any ownership rights.
                    </p>
                    <p>
                      You may not reproduce, distribute, modify, or create derivative works from our platform without
                      express written permission.
                    </p>
                  </div>
                </section>

                {/* Section 6 */}
                <section id="disclaimers" className="scroll-mt-32">
                  <SectionHeader number="06" title="Disclaimers & Limitations" />
                  <div className="prose-custom">
                    <p>
                      GameHub is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or
                      implied. We do not guarantee that:
                    </p>
                    <ul>
                      <li>The service will be uninterrupted or error-free</li>
                      <li>Data from third-party platforms will always be accurate or current</li>
                      <li>All gaming platforms will remain integrated indefinitely</li>
                    </ul>
                    <div className="callout warning">
                      <strong>Limitation of Liability:</strong> To the maximum extent permitted by law, GameHub shall not
                      be liable for any indirect, incidental, special, consequential, or punitive damages arising from
                      your use of the platform.
                    </div>
                  </div>
                </section>

                {/* Section 7 */}
                <section id="termination" className="scroll-mt-32">
                  <SectionHeader number="07" title="Termination" />
                  <div className="prose-custom">
                    <p>
                      You may terminate your account at any time by contacting us or using the account deletion feature
                      in your settings. Upon termination:
                    </p>
                    <ul>
                      <li>Your access to the platform will be revoked</li>
                      <li>Your personal data will be handled according to our Privacy Policy</li>
                      <li>Certain provisions of these Terms will survive termination</li>
                    </ul>
                    <p>
                      We reserve the right to suspend or terminate your account if you violate these Terms or for any
                      other reason at our sole discretion, with or without notice.
                    </p>
                  </div>
                </section>

                {/* Section 8 */}
                <section id="changes" className="scroll-mt-32">
                  <SectionHeader number="08" title="Changes to Terms" />
                  <div className="prose-custom">
                    <p>
                      We may update these Terms from time to time to reflect changes in our practices or for legal,
                      operational, or regulatory reasons. When we make changes:
                    </p>
                    <ul>
                      <li>We will update the &quot;Last Updated&quot; date at the top of this page</li>
                      <li>For significant changes, we will notify you via email or platform notification</li>
                      <li>Your continued use of GameHub after changes constitutes acceptance</li>
                    </ul>
                    <p>
                      We encourage you to review these Terms periodically to stay informed of any updates.
                    </p>
                  </div>
                </section>

                {/* Section 9 */}
                <section id="contact" className="scroll-mt-32">
                  <SectionHeader number="09" title="Contact Information" />
                  <div className="prose-custom">
                    <p>
                      If you have any questions, concerns, or requests regarding these Terms of Service, please contact us:
                    </p>
                    <div className="bg-theme-secondary border border-theme rounded-xl p-6 my-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-theme-subtle w-16">EMAIL</span>
                          <a href="mailto:legal@gamehub.com" className="text-accent-cyan hover:underline">
                            legal@gamehub.com
                          </a>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-theme-subtle w-16">SUPPORT</span>
                          <a href="mailto:support@gamehub.com" className="text-accent-cyan hover:underline">
                            support@gamehub.com
                          </a>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-theme-muted">
                      We aim to respond to all inquiries within 48 business hours.
                    </p>
                  </div>
                </section>
              </div>

              {/* Footer Navigation */}
              <div className="mt-16 pt-8 border-t border-theme">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Link
                    href="/privacy"
                    className="flex items-center gap-2 text-theme-muted hover:text-accent-cyan transition-colors"
                  >
                    <span>Read our Privacy Policy</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <span className="text-xs font-mono text-theme-subtle">
                    © {new Date().getFullYear()} GameHub. All rights reserved.
                  </span>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      <style jsx>{`
        .prose-custom {
          font-size: 1rem;
          line-height: 1.8;
          color: var(--theme-text-secondary);
        }
        .prose-custom p {
          margin-bottom: 1.25rem;
        }
        .prose-custom ul {
          margin: 1.25rem 0;
          padding-left: 1.5rem;
        }
        .prose-custom li {
          margin-bottom: 0.5rem;
          position: relative;
          padding-left: 0.5rem;
        }
        .prose-custom li::marker {
          color: var(--theme-accent-cyan);
        }
        .prose-custom strong {
          color: var(--theme-text-primary);
          font-weight: 600;
        }
        .prose-custom .callout {
          background: var(--theme-hover-bg);
          border: 1px solid var(--theme-border);
          border-left: 3px solid var(--theme-accent-cyan);
          border-radius: 0.5rem;
          padding: 1rem 1.25rem;
          margin: 1.5rem 0;
          font-size: 0.9375rem;
        }
        .prose-custom .callout.warning {
          border-left-color: #f59e0b;
        }
      `}</style>
    </div>
  );
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="relative">
        <div className="w-12 h-12 rounded-lg bg-linear-to-br from-cyan-500/20 to-violet-500/20 border border-accent-cyan/30 flex items-center justify-center">
          <span className="text-sm font-mono font-bold text-accent-cyan">{number}</span>
        </div>
        <div className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-accent-cyan/50" />
        <div className="absolute -top-1 -right-1 w-2 h-2 border-r border-t border-accent-cyan/50" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l border-b border-accent-cyan/50" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r border-b border-accent-cyan/50" />
      </div>
      <h2 className="text-2xl font-bold font-family-display text-theme-primary">
        {title}
      </h2>
    </div>
  );
}
