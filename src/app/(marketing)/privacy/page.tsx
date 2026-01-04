'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Gamepad2, ArrowLeft, ChevronRight, Menu, X, Shield } from 'lucide-react';

const sections = [
  { id: 'information-collected', title: 'Information We Collect', number: '01' },
  { id: 'how-we-use', title: 'How We Use Your Information', number: '02' },
  { id: 'third-party', title: 'Third-Party Integrations', number: '03' },
  { id: 'data-security', title: 'Data Security', number: '04' },
  { id: 'your-rights', title: 'Your Rights', number: '05' },
  { id: 'cookies', title: 'Cookies & Tracking', number: '06' },
  { id: 'children', title: "Children's Privacy", number: '07' },
  { id: 'changes', title: 'Changes to This Policy', number: '08' },
  { id: 'contact', title: 'Contact Information', number: '09' },
];

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState('information-collected');
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
          className="h-full bg-linear-to-r from-violet-500 to-cyan-500 transition-all duration-150"
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
                <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-l border-t border-violet-400/50" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-r border-t border-violet-400/50" />
                <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-l border-b border-violet-400/50" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-r border-b border-violet-400/50" />
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
                className="flex items-center gap-2 px-4 py-2 text-sm text-theme-muted hover:text-accent-violet border border-theme hover:border-accent-violet/50 rounded-lg bg-theme-hover transition-all"
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
              <Shield className="w-4 h-4 text-accent-violet" />
              <span className="text-xs font-mono text-theme-muted uppercase tracking-wider">Table of Contents</span>
            </div>
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                    activeSection === section.id
                      ? 'bg-accent-violet/10 text-accent-violet'
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
                    <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-violet-400/30" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-violet-400/30" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-violet-400/30" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-violet-400/30" />
                  </div>

                  <div className="bg-theme-secondary/50 backdrop-blur-sm border border-theme rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-5 pb-4 border-b border-theme">
                      <Shield className="w-4 h-4 text-accent-violet" />
                      <span className="text-[10px] font-mono text-accent-violet uppercase tracking-wider">
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
                              ? 'bg-accent-violet/10 border border-accent-violet/30'
                              : 'hover:bg-theme-hover border border-transparent'
                          }`}
                        >
                          <span className={`text-xs font-mono transition-colors ${
                            activeSection === section.id
                              ? 'text-accent-violet'
                              : 'text-theme-subtle group-hover:text-theme-muted'
                          }`}>
                            {section.number}
                          </span>
                          <span className={`text-sm transition-colors ${
                            activeSection === section.id
                              ? 'text-accent-violet'
                              : 'text-theme-muted group-hover:text-theme-primary'
                          }`}>
                            {section.title}
                          </span>
                          {activeSection === section.id && (
                            <ChevronRight className="w-4 h-4 ml-auto text-accent-violet" />
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
                  <div className="h-px flex-1 max-w-12 bg-linear-to-r from-transparent to-accent-violet" />
                  <span className="text-[10px] font-mono text-accent-violet uppercase tracking-wider">
                    // DATA_PROTECTION
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold font-family-display tracking-tight mb-4">
                  Privacy Policy
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-theme-muted">
                  <span className="font-mono">Last Updated: December 2024</span>
                  <span className="w-1 h-1 rounded-full bg-text-subtle" />
                  <span className="font-mono">Version 1.0</span>
                </div>
                <p className="mt-6 text-theme-secondary leading-relaxed max-w-2xl">
                  At GameHub, we are committed to protecting your privacy and ensuring the security of your personal
                  information. This Privacy Policy explains how we collect, use, and safeguard your data.
                </p>
              </div>

              {/* Sections */}
              <div className="space-y-16">
                {/* Section 1 */}
                <section id="information-collected" className="scroll-mt-32">
                  <SectionHeader number="01" title="Information We Collect" />
                  <div className="prose-custom">
                    <p>We collect information in several ways to provide and improve our services:</p>

                    <h3>Information You Provide</h3>
                    <ul>
                      <li><strong>Account Information:</strong> Email address, username, and password when you create an account</li>
                      <li><strong>Profile Data:</strong> Optional information like display name and avatar</li>
                      <li><strong>Communications:</strong> Messages you send to us for support or feedback</li>
                    </ul>

                    <h3>Information from Gaming Platforms</h3>
                    <p>When you connect your gaming accounts, we may collect:</p>
                    <ul>
                      <li>Game library and ownership information</li>
                      <li>Achievement and trophy data</li>
                      <li>Playtime statistics</li>
                      <li>Public profile information (username, avatar)</li>
                    </ul>

                    <h3>Automatically Collected Information</h3>
                    <ul>
                      <li>Device information (browser type, operating system)</li>
                      <li>IP address and approximate location</li>
                      <li>Usage patterns and preferences</li>
                      <li>Cookies and similar technologies (see Section 06)</li>
                    </ul>
                  </div>
                </section>

                {/* Section 2 */}
                <section id="how-we-use" className="scroll-mt-32">
                  <SectionHeader number="02" title="How We Use Your Information" />
                  <div className="prose-custom">
                    <p>We use the collected information for the following purposes:</p>

                    <div className="grid sm:grid-cols-2 gap-4 my-6">
                      {[
                        { title: 'Service Delivery', desc: 'To provide and maintain our game library aggregation features' },
                        { title: 'Personalization', desc: 'To customize your experience and recommendations' },
                        { title: 'Communication', desc: 'To send important updates, security alerts, and support responses' },
                        { title: 'Analytics', desc: 'To understand usage patterns and improve our services' },
                        { title: 'Security', desc: 'To detect and prevent fraud, abuse, or security incidents' },
                        { title: 'Legal Compliance', desc: 'To comply with applicable laws and regulations' },
                      ].map((item) => (
                        <div key={item.title} className="p-4 bg-theme-hover border border-theme rounded-lg">
                          <h4 className="font-semibold text-theme-primary mb-1">{item.title}</h4>
                          <p className="text-sm text-theme-muted m-0">{item.desc}</p>
                        </div>
                      ))}
                    </div>

                    <div className="callout">
                      <strong>We do not sell your personal information.</strong> Your data is never sold to third parties
                      for marketing or advertising purposes.
                    </div>
                  </div>
                </section>

                {/* Section 3 */}
                <section id="third-party" className="scroll-mt-32">
                  <SectionHeader number="03" title="Third-Party Integrations" />
                  <div className="prose-custom">
                    <p>
                      GameHub integrates with various gaming platforms to provide our services. When you connect
                      a gaming account, we interact with these third parties:
                    </p>

                    <div className="overflow-x-auto my-6">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-theme">
                            <th className="text-left py-3 px-4 text-sm font-mono text-theme-muted">Platform</th>
                            <th className="text-left py-3 px-4 text-sm font-mono text-theme-muted">Data Accessed</th>
                            <th className="text-left py-3 px-4 text-sm font-mono text-theme-muted">Auth Method</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {[
                            { platform: 'Steam', data: 'Games, Achievements, Playtime', auth: 'OAuth 2.0' },
                            { platform: 'PlayStation', data: 'Games, Trophies, Profile', auth: 'OAuth 2.0' },
                            { platform: 'Xbox', data: 'Games, Achievements, Gamerscore', auth: 'OAuth 2.0' },
                            { platform: 'Epic Games', data: 'Games, Profile', auth: 'OAuth 2.0' },
                            { platform: 'Nintendo', data: 'Games (limited)', auth: 'API Key' },
                            { platform: 'GOG', data: 'Games, Achievements', auth: 'OAuth 2.0' },
                          ].map((row) => (
                            <tr key={row.platform} className="border-b border-theme">
                              <td className="py-3 px-4 font-medium text-theme-primary">{row.platform}</td>
                              <td className="py-3 px-4 text-theme-secondary">{row.data}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-1 bg-accent-cyan/10 text-accent-cyan rounded text-xs font-mono">
                                  {row.auth}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <p>
                      Each platform has its own privacy policy governing how they handle your data. We encourage
                      you to review their policies. GameHub only accesses the minimum data necessary to provide
                      our services.
                    </p>
                  </div>
                </section>

                {/* Section 4 */}
                <section id="data-security" className="scroll-mt-32">
                  <SectionHeader number="04" title="Data Security" />
                  <div className="prose-custom">
                    <p>
                      We implement industry-standard security measures to protect your information:
                    </p>
                    <ul>
                      <li><strong>Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                      <li><strong>Access Controls:</strong> Strict role-based access to user data</li>
                      <li><strong>Regular Audits:</strong> Periodic security assessments and penetration testing</li>
                      <li><strong>Secure Authentication:</strong> We never store gaming platform passwords</li>
                      <li><strong>Incident Response:</strong> Documented procedures for handling security events</li>
                    </ul>

                    <div className="callout warning">
                      <strong>Security Notice:</strong> While we take extensive measures to protect your data, no
                      system is 100% secure. We encourage you to use strong, unique passwords and enable two-factor
                      authentication where available.
                    </div>
                  </div>
                </section>

                {/* Section 5 */}
                <section id="your-rights" className="scroll-mt-32">
                  <SectionHeader number="05" title="Your Rights" />
                  <div className="prose-custom">
                    <p>Depending on your location, you may have the following rights regarding your personal data:</p>

                    <div className="space-y-4 my-6">
                      {[
                        { right: 'Access', desc: 'Request a copy of the personal data we hold about you' },
                        { right: 'Correction', desc: 'Request correction of inaccurate or incomplete data' },
                        { right: 'Deletion', desc: 'Request deletion of your personal data ("right to be forgotten")' },
                        { right: 'Portability', desc: 'Receive your data in a machine-readable format' },
                        { right: 'Objection', desc: 'Object to certain types of data processing' },
                        { right: 'Restriction', desc: 'Request limitation of how we use your data' },
                      ].map((item) => (
                        <div key={item.right} className="flex gap-4 items-start">
                          <div className="w-24 shrink-0">
                            <span className="inline-block px-3 py-1 bg-accent-violet/10 text-accent-violet rounded-full text-xs font-mono">
                              {item.right}
                            </span>
                          </div>
                          <p className="text-theme-secondary m-0">{item.desc}</p>
                        </div>
                      ))}
                    </div>

                    <p>
                      To exercise any of these rights, please contact us using the information in Section 09.
                      We will respond to your request within 30 days.
                    </p>
                  </div>
                </section>

                {/* Section 6 */}
                <section id="cookies" className="scroll-mt-32">
                  <SectionHeader number="06" title="Cookies & Tracking" />
                  <div className="prose-custom">
                    <p>We use cookies and similar technologies to enhance your experience:</p>

                    <h3>Essential Cookies</h3>
                    <p>
                      Required for the platform to function. These include session management, authentication,
                      and security cookies. Cannot be disabled.
                    </p>

                    <h3>Analytics Cookies</h3>
                    <p>
                      Help us understand how users interact with GameHub. We use privacy-focused analytics
                      that do not track you across websites.
                    </p>

                    <h3>Preference Cookies</h3>
                    <p>
                      Remember your settings like theme preference (light/dark mode) and display options.
                    </p>

                    <div className="callout">
                      <strong>Managing Cookies:</strong> You can control cookies through your browser settings.
                      Note that disabling essential cookies may prevent some features from working correctly.
                    </div>
                  </div>
                </section>

                {/* Section 7 */}
                <section id="children" className="scroll-mt-32">
                  <SectionHeader number="07" title="Children's Privacy" />
                  <div className="prose-custom">
                    <p>
                      GameHub is not intended for children under the age of 13. We do not knowingly collect
                      personal information from children under 13 years of age.
                    </p>
                    <p>
                      If you are a parent or guardian and believe your child has provided us with personal
                      information, please contact us immediately. We will take steps to delete such information
                      from our systems.
                    </p>
                    <p>
                      Users between 13 and 18 years of age should review these terms with a parent or guardian
                      to ensure they understand their rights and our practices.
                    </p>
                  </div>
                </section>

                {/* Section 8 */}
                <section id="changes" className="scroll-mt-32">
                  <SectionHeader number="08" title="Changes to This Policy" />
                  <div className="prose-custom">
                    <p>
                      We may update this Privacy Policy periodically to reflect changes in our practices,
                      technologies, legal requirements, or other factors. When we make changes:
                    </p>
                    <ul>
                      <li>We will update the &quot;Last Updated&quot; date at the top of this policy</li>
                      <li>For significant changes, we will provide prominent notice (email or platform notification)</li>
                      <li>We will maintain an archive of previous policy versions upon request</li>
                    </ul>
                    <p>
                      Your continued use of GameHub after changes to this policy constitutes acceptance of
                      the updated terms. We encourage you to review this policy periodically.
                    </p>
                  </div>
                </section>

                {/* Section 9 */}
                <section id="contact" className="scroll-mt-32">
                  <SectionHeader number="09" title="Contact Information" />
                  <div className="prose-custom">
                    <p>
                      If you have questions, concerns, or requests regarding this Privacy Policy or our data
                      practices, please reach out to us:
                    </p>
                    <div className="bg-theme-secondary border border-theme rounded-xl p-6 my-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <span className="text-xs font-mono text-theme-subtle w-24 shrink-0 pt-0.5">PRIVACY</span>
                          <div>
                            <a href="mailto:privacy@gamehub.com" className="text-accent-violet hover:underline">
                              privacy@gamehub.com
                            </a>
                            <p className="text-sm text-theme-muted mt-1 mb-0">
                              For privacy-specific inquiries and data requests
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <span className="text-xs font-mono text-theme-subtle w-24 shrink-0 pt-0.5">DPO</span>
                          <div>
                            <a href="mailto:dpo@gamehub.com" className="text-accent-violet hover:underline">
                              dpo@gamehub.com
                            </a>
                            <p className="text-sm text-theme-muted mt-1 mb-0">
                              Data Protection Officer for GDPR-related matters
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <span className="text-xs font-mono text-theme-subtle w-24 shrink-0 pt-0.5">SUPPORT</span>
                          <div>
                            <a href="mailto:support@gamehub.com" className="text-accent-violet hover:underline">
                              support@gamehub.com
                            </a>
                            <p className="text-sm text-theme-muted mt-1 mb-0">
                              General support and account assistance
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-theme-muted">
                      We aim to respond to all privacy-related inquiries within 30 days. For urgent security
                      matters, please include &quot;URGENT&quot; in your subject line.
                    </p>
                  </div>
                </section>
              </div>

              {/* Footer Navigation */}
              <div className="mt-16 pt-8 border-t border-theme">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Link
                    href="/terms"
                    className="flex items-center gap-2 text-theme-muted hover:text-accent-violet transition-colors"
                  >
                    <span>Read our Terms of Service</span>
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
        .prose-custom h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--theme-text-primary);
          margin-top: 2rem;
          margin-bottom: 0.75rem;
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
          color: var(--theme-accent-violet);
        }
        .prose-custom strong {
          color: var(--theme-text-primary);
          font-weight: 600;
        }
        .prose-custom .callout {
          background: var(--theme-hover-bg);
          border: 1px solid var(--theme-border);
          border-left: 3px solid var(--theme-accent-violet);
          border-radius: 0.5rem;
          padding: 1rem 1.25rem;
          margin: 1.5rem 0;
          font-size: 0.9375rem;
        }
        .prose-custom .callout.warning {
          border-left-color: #f59e0b;
        }
        .prose-custom table {
          background: var(--theme-bg-secondary);
          border: 1px solid var(--theme-border);
          border-radius: 0.75rem;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="relative">
        <div className="w-12 h-12 rounded-lg bg-linear-to-br from-violet-500/20 to-cyan-500/20 border border-accent-violet/30 flex items-center justify-center">
          <span className="text-sm font-mono font-bold text-accent-violet">{number}</span>
        </div>
        <div className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-accent-violet/50" />
        <div className="absolute -top-1 -right-1 w-2 h-2 border-r border-t border-accent-violet/50" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l border-b border-accent-violet/50" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r border-b border-accent-violet/50" />
      </div>
      <h2 className="text-2xl font-bold font-family-display text-theme-primary">
        {title}
      </h2>
    </div>
  );
}
