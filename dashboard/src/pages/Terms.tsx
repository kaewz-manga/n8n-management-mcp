import { Link } from 'react-router-dom';
import { Zap, ArrowLeft, AlertTriangle, CheckCircle, XCircle, Mail, Scale } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-n2f-bg">
      {/* Header */}
      <header className="border-b border-n2f-border sticky top-0 bg-n2f-bg/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-n2f-accent p-2 rounded-lg">
                <Zap className="h-5 w-5 text-gray-900" />
              </div>
              <span className="text-xl font-bold text-n2f-text">n8n Management MCP</span>
            </Link>
            <Link to="/" className="text-n2f-text-secondary hover:text-n2f-text flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-n2f-text mb-2">Terms of Service</h1>
          <p className="text-n2f-text-muted">Last updated: February 5, 2026</p>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-yellow-400 mb-2">Important Notice</h2>
              <p className="text-yellow-200/80 text-sm">
                n8n Management MCP is a <strong>tool for AI agents</strong> to interact with your n8n instances.
                You are fully responsible for all actions performed by AI agents using this service.
                The Service proxies requests to YOUR n8n instance - we have no control over what workflows
                are executed or what data is processed.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8 text-n2f-text-secondary">
          {/* 1. Agreement to Terms */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">1. Agreement to Terms</h2>
            <p className="mb-3">
              By accessing or using n8n Management MCP ("Service"), you agree to be bound by these Terms of Service ("Terms").
              If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these Terms.
            </p>
            <p>
              If you do not agree to these Terms, you must not use the Service.
            </p>
          </section>

          {/* 2. Description of Service */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">2. Description of Service</h2>
            <p className="mb-3">
              n8n Management MCP provides a hosted Model Context Protocol (MCP) server that enables AI assistants
              (such as Claude, Cursor, or other MCP-compatible clients) to interact with your n8n automation platform.
            </p>
            <p className="mb-3">The Service includes:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>MCP endpoint for AI assistant integration</li>
              <li>Secure storage of n8n connection credentials</li>
              <li>API key management for authentication</li>
              <li>Usage tracking and rate limiting</li>
              <li>Web dashboard for account management</li>
            </ul>
            <p className="mt-3 text-sm text-n2f-text-muted">
              <strong>Disclaimer:</strong> This Service is NOT affiliated with, endorsed by, or officially connected to n8n GmbH.
              "n8n" is a trademark of n8n GmbH.
            </p>
          </section>

          {/* 3. Account Registration */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">3. Account Registration</h2>
            <p className="mb-3">To use the Service, you must create an account. You agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Not share your account with others or create multiple accounts</li>
            </ul>
            <p className="mt-3">
              You may register using email/password or OAuth providers (GitHub, Google).
              We recommend enabling two-factor authentication (2FA) for enhanced security.
            </p>
          </section>

          {/* 4. API Key Management */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">4. API Key Management</h2>
            <p className="mb-3">API keys are used to authenticate MCP clients with the Service.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-n2f-text">Generation:</strong> API keys are generated securely and shown only once</li>
              <li><strong className="text-n2f-text">Storage:</strong> Keys are stored as SHA-256 hashes - we cannot retrieve your original key</li>
              <li><strong className="text-n2f-text">Revocation:</strong> You can revoke keys at any time from the dashboard</li>
              <li><strong className="text-n2f-text">Responsibility:</strong> You are responsible for keeping your API keys secure</li>
            </ul>
            <p className="mt-3 text-yellow-400 text-sm">
              <strong>Warning:</strong> Treat API keys like passwords. Do not commit them to public repositories or share them.
            </p>
          </section>

          {/* 5. Service Plans & Billing */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">5. Service Plans & Billing</h2>

            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-n2f-border">
                    <th className="text-left py-2 text-n2f-text">Plan</th>
                    <th className="text-left py-2 text-n2f-text">Price</th>
                    <th className="text-left py-2 text-n2f-text">Daily Limit</th>
                    <th className="text-left py-2 text-n2f-text">Rate Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-n2f-border">
                  <tr>
                    <td className="py-2">Free</td>
                    <td className="py-2">$0/month</td>
                    <td className="py-2">100 requests/day</td>
                    <td className="py-2">50 requests/min</td>
                  </tr>
                  <tr>
                    <td className="py-2">Pro</td>
                    <td className="py-2">$19/month</td>
                    <td className="py-2">5,000 requests/day</td>
                    <td className="py-2">100 requests/min</td>
                  </tr>
                  <tr>
                    <td className="py-2">Enterprise</td>
                    <td className="py-2">Custom</td>
                    <td className="py-2">Unlimited</td>
                    <td className="py-2">Custom</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-3">
              <p><strong className="text-n2f-text">Billing:</strong> Paid plans are billed monthly via Stripe. Subscriptions auto-renew unless cancelled.</p>
              <p><strong className="text-n2f-text">Upgrades:</strong> Plan upgrades take effect immediately with prorated billing.</p>
              <p><strong className="text-n2f-text">Downgrades:</strong> Plan downgrades take effect at the next billing cycle.</p>
              <p><strong className="text-n2f-text">Refunds:</strong> We do not offer refunds for partial months. You may cancel at any time.</p>
            </div>
          </section>

          {/* 6. Permitted Use */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">6. Permitted Use</h2>
            <p className="mb-3">You may use the Service to:</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>Connect AI assistants to your own n8n instances</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>Manage workflows, executions, and credentials via MCP</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>Build integrations and automations for legitimate purposes</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>Use for commercial or personal projects within plan limits</span>
              </div>
            </div>
          </section>

          {/* 7. Prohibited Uses */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">7. Prohibited Uses</h2>
            <p className="mb-3">You may NOT use the Service to:</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span>Violate any applicable laws or regulations</span>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span>Access n8n instances you do not own or have authorization to access</span>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span>Circumvent rate limits or abuse the Service</span>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span>Distribute malware or malicious workflows</span>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span>Attempt to reverse engineer or disrupt the Service</span>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span>Scrape data or use automated tools beyond MCP clients</span>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span>Resell or redistribute the Service without permission</span>
              </div>
            </div>
            <p className="mt-4">
              Violations may result in immediate account termination without refund.
            </p>
          </section>

          {/* 8. AI Agent Responsibility */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">8. AI Agent Responsibility</h2>
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-200">
                <strong className="text-red-400">CRITICAL:</strong> You accept full responsibility for all actions
                performed by AI agents using your API keys. This includes but is not limited to:
              </p>
            </div>
            <ul className="list-disc pl-6 space-y-2">
              <li>Workflow modifications, activations, or deletions</li>
              <li>Execution of workflows and their consequences</li>
              <li>Access to and modification of credentials</li>
              <li>Any data processed or transmitted through n8n</li>
              <li>Actions taken based on AI agent recommendations</li>
            </ul>
            <p className="mt-3">
              We strongly recommend reviewing AI agent actions before they are executed, especially for
              destructive operations or sensitive data access.
            </p>
          </section>

          {/* 9. Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">9. Intellectual Property</h2>
            <div className="space-y-3">
              <p>
                <strong className="text-n2f-text">Your Content:</strong> You retain all rights to your n8n workflows,
                credentials, and data. We do not claim ownership of your content.
              </p>
              <p>
                <strong className="text-n2f-text">Our Service:</strong> The Service, including its design, code, and
                documentation, is owned by Node2Flow. You may not copy, modify, or distribute it without permission.
              </p>
              <p>
                <strong className="text-n2f-text">Trademarks:</strong> "n8n Management MCP" and "Node2Flow" are our
                trademarks. "n8n" is a trademark of n8n GmbH.
              </p>
            </div>
          </section>

          {/* 10. Third-Party Services */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">10. Third-Party Services</h2>
            <p className="mb-3">The Service relies on the following third-party providers:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-n2f-text">Cloudflare:</strong> Hosting, CDN, and DDoS protection</li>
              <li><strong className="text-n2f-text">Stripe:</strong> Payment processing</li>
              <li><strong className="text-n2f-text">GitHub/Google:</strong> OAuth authentication (optional)</li>
            </ul>
            <p className="mt-3">
              Your use of the Service is also subject to the terms and privacy policies of these providers.
            </p>
          </section>

          {/* 11. Data & Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">11. Data & Privacy</h2>
            <p className="mb-3">
              Your privacy is important to us. Please review our{' '}
              <Link to="/privacy" className="text-n2f-accent hover:underline">Privacy Policy</Link>{' '}
              for detailed information about how we collect, use, and protect your data.
            </p>
            <p>Key points:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>We collect minimal data necessary to provide the Service</li>
              <li>Your n8n credentials are encrypted with AES-256-GCM</li>
              <li>We do not sell your data or use third-party analytics</li>
              <li>You can delete your account and data at any time</li>
            </ul>
          </section>

          {/* 12. Service Availability */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">12. Service Availability & SLA</h2>
            <div className="bg-n2f-elevated rounded-lg p-4 mb-4">
              <p className="text-n2f-text font-medium mb-2">Beta Status Notice</p>
              <p className="text-sm">
                The Service is currently in <strong>beta</strong>. While we strive for high availability,
                we do not guarantee any specific uptime SLA at this time.
              </p>
            </div>
            <ul className="list-disc pl-6 space-y-2">
              <li>We may perform maintenance with reasonable notice when possible</li>
              <li>We reserve the right to modify, suspend, or discontinue features</li>
              <li>We aim to provide 99.9% uptime but do not guarantee it</li>
              <li>Support is provided on a best-effort basis via email</li>
            </ul>
          </section>

          {/* 13. Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">13. Limitation of Liability</h2>
            <div className="bg-n2f-elevated rounded-lg p-4 mb-4">
              <p className="font-medium text-n2f-text mb-2">Liability Cap</p>
              <p className="text-sm">
                Our maximum liability is limited to the <strong>greater of: (a) $100 USD, or (b) the total
                amount you paid us in the 12 months preceding the claim</strong>.
              </p>
            </div>
            <p className="mb-3">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
              WE DISCLAIM ALL WARRANTIES INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
              AND NON-INFRINGEMENT.
            </p>
            <p>
              WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
              DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES.
            </p>
          </section>

          {/* 14. Indemnification */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">14. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Node2Flow and its affiliates from any claims,
              damages, losses, or expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Your use of the Service</li>
              <li>Violation of these Terms</li>
              <li>Infringement of third-party rights</li>
              <li>Actions of AI agents using your credentials</li>
            </ul>
          </section>

          {/* 15. Termination */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">15. Termination</h2>
            <div className="space-y-3">
              <p>
                <strong className="text-n2f-text">By You:</strong> You may terminate your account at any time
                through Dashboard → Settings → Delete Account.
              </p>
              <p>
                <strong className="text-n2f-text">By Us:</strong> We may suspend or terminate your account
                immediately for violations of these Terms, without notice or refund.
              </p>
              <p>
                <strong className="text-n2f-text">Effect:</strong> Upon termination, your right to use the
                Service ceases immediately. Data is retained for 30 days, then permanently deleted.
              </p>
            </div>
          </section>

          {/* 16. Governing Law */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">16. Governing Law & Disputes</h2>
            <div className="flex items-start gap-3 mb-4">
              <Scale className="h-5 w-5 text-n2f-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="mb-2">
                  These Terms are governed by the laws of <strong className="text-n2f-text">Thailand</strong>,
                  without regard to conflict of law principles.
                </p>
                <p>
                  Any disputes shall be resolved in the courts of Bangkok, Thailand. You agree to submit
                  to the personal jurisdiction of these courts.
                </p>
              </div>
            </div>
            <p className="text-sm text-n2f-text-muted">
              For EU users: Nothing in these Terms affects your statutory rights under applicable EU consumer protection laws.
            </p>
          </section>

          {/* 17. Contact */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">17. Contact Information</h2>
            <p className="mb-4">For questions about these Terms or to report violations:</p>
            <div className="bg-n2f-elevated rounded-lg p-4 flex items-center gap-3">
              <Mail className="h-5 w-5 text-n2f-accent" />
              <div>
                <p className="text-n2f-text font-medium">Email</p>
                <a href="mailto:legal@node2flow.net" className="text-n2f-accent hover:underline">
                  legal@node2flow.net
                </a>
              </div>
            </div>
          </section>

          {/* Changes Notice */}
          <section className="bg-n2f-card border border-n2f-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-n2f-text mb-4">Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of significant changes via
              email or in-app notification at least <strong className="text-n2f-text">14 days</strong> before
              they take effect. Continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>
        </div>

        {/* Footer navigation */}
        <div className="mt-12 pt-8 border-t border-n2f-border flex justify-between">
          <Link to="/privacy" className="text-n2f-accent hover:underline">
            ← Privacy Policy
          </Link>
          <Link to="/" className="text-n2f-accent hover:underline">
            Back to Home →
          </Link>
        </div>
      </main>
    </div>
  );
}
