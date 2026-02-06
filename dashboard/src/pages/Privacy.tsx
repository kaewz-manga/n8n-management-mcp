import { Link } from 'react-router-dom';
import { Zap, ArrowLeft, Shield, Database, Lock, Globe, Trash2, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Privacy() {
  const { user } = useAuth();

  const content = (
    <>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-n2f-text mb-2">Privacy Policy</h1>
          <p className="text-n2f-text-muted">Last updated: February 5, 2026</p>
        </div>

        {/* Quick Summary */}
        <div className="bg-n2f-card border border-n2f-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-n2f-text mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-n2f-accent" />
            Privacy at a Glance
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <Database className="h-4 w-4 text-green-400 mt-0.5" />
              <div>
                <p className="text-n2f-text font-medium">Minimal Data Collection</p>
                <p className="text-n2f-text-muted">Only what's necessary to provide the service</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="h-4 w-4 text-green-400 mt-0.5" />
              <div>
                <p className="text-n2f-text font-medium">Encrypted at Rest</p>
                <p className="text-n2f-text-muted">AES-256-GCM for sensitive data</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 text-green-400 mt-0.5" />
              <div>
                <p className="text-n2f-text font-medium">No Tracking</p>
                <p className="text-n2f-text-muted">No third-party analytics or ads</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Trash2 className="h-4 w-4 text-green-400 mt-0.5" />
              <div>
                <p className="text-n2f-text font-medium">Easy Deletion</p>
                <p className="text-n2f-text-muted">Delete your account anytime from Settings</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 text-n2f-text-secondary">
          {/* 1. Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">1. Introduction</h2>
            <p className="mb-3">
              n8n Management MCP ("Service", "we", "us", "our") is operated by Node2Flow. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our hosted MCP service.
            </p>
            <p>
              We are committed to protecting your privacy. We do not sell your personal information and we minimize data collection to only what is necessary to provide the Service.
            </p>
          </section>

          {/* 2. Definitions */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">2. Definitions</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-n2f-text">Personal Data:</strong> Information that can be used to identify you (e.g., email address)</li>
              <li><strong className="text-n2f-text">Usage Data:</strong> Automatically collected information about how you use the Service</li>
              <li><strong className="text-n2f-text">Connection Data:</strong> Information about your n8n instances (URLs, encrypted API keys)</li>
              <li><strong className="text-n2f-text">MCP:</strong> Model Context Protocol - a standard for AI assistant integrations</li>
            </ul>
          </section>

          {/* 3. Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">3. Information We Collect</h2>

            <div className="space-y-6">
              <div className="bg-n2f-elevated rounded-lg p-4">
                <h3 className="text-lg font-medium text-n2f-text mb-2">3A. Account Information</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong className="text-n2f-text">Email address:</strong> Used for login and account notifications</li>
                  <li><strong className="text-n2f-text">Password:</strong> Hashed using PBKDF2 with 100,000 iterations (we never store plain text)</li>
                  <li><strong className="text-n2f-text">OAuth data:</strong> If using GitHub/Google login, we receive your email and profile ID</li>
                </ul>
              </div>

              <div className="bg-n2f-elevated rounded-lg p-4">
                <h3 className="text-lg font-medium text-n2f-text mb-2">3B. API Keys</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong className="text-n2f-text">Your API keys:</strong> Stored as SHA-256 hashes only - we cannot retrieve the original key</li>
                  <li><strong className="text-n2f-text">Key prefix:</strong> First 8 characters stored for identification (e.g., n2f_abc1...)</li>
                  <li><strong className="text-n2f-text">Key metadata:</strong> Name, creation date, last used timestamp</li>
                </ul>
              </div>

              <div className="bg-n2f-elevated rounded-lg p-4">
                <h3 className="text-lg font-medium text-n2f-text mb-2">3C. n8n Connection Data</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong className="text-n2f-text">Instance URL:</strong> Your n8n server address</li>
                  <li><strong className="text-n2f-text">n8n API key:</strong> Encrypted using AES-256-GCM before storage</li>
                  <li><strong className="text-n2f-text">Connection name:</strong> Your custom label for the connection</li>
                </ul>
              </div>

              <div className="bg-n2f-elevated rounded-lg p-4">
                <h3 className="text-lg font-medium text-n2f-text mb-2">3D. Usage Data</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong className="text-n2f-text">Request logs:</strong> Timestamp, tool name, success/failure status</li>
                  <li><strong className="text-n2f-text">Rate limiting:</strong> Request counts for enforcing plan limits</li>
                  <li><strong className="text-n2f-text">Error logs:</strong> For debugging and service improvement</li>
                </ul>
                <p className="mt-2 text-sm text-n2f-text-muted">
                  Usage logs are automatically deleted after <strong>90 days</strong>.
                </p>
              </div>

              <div className="bg-n2f-elevated rounded-lg p-4">
                <h3 className="text-lg font-medium text-n2f-text mb-2">3E. Payment Information</h3>
                <p>
                  Payment processing is handled by <strong>Stripe</strong>. We do not store your credit card details. We only receive:
                </p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Stripe customer ID (for subscription management)</li>
                  <li>Subscription status and plan type</li>
                  <li>Invoice history references</li>
                </ul>
              </div>

              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-red-400 mb-2">3F. What We DON'T Collect</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong className="text-n2f-text">Workflow content:</strong> We never see or store your n8n workflow data</li>
                  <li><strong className="text-n2f-text">Execution data:</strong> Your workflow execution results stay on your n8n instance</li>
                  <li><strong className="text-n2f-text">Credentials:</strong> Your n8n credentials are never transmitted to us</li>
                  <li><strong className="text-n2f-text">Telemetry:</strong> We do not collect anonymous usage telemetry</li>
                  <li><strong className="text-n2f-text">Tracking:</strong> No Google Analytics, Facebook pixels, or third-party trackers</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">4. How We Use Your Information</h2>
            <p className="mb-3">We use collected information for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-n2f-text">Authentication:</strong> Verifying your identity when you log in</li>
              <li><strong className="text-n2f-text">Service delivery:</strong> Proxying MCP requests to your n8n instances</li>
              <li><strong className="text-n2f-text">Rate limiting:</strong> Enforcing plan limits to ensure fair usage</li>
              <li><strong className="text-n2f-text">Billing:</strong> Processing subscription payments via Stripe</li>
              <li><strong className="text-n2f-text">Security:</strong> Detecting and preventing unauthorized access</li>
              <li><strong className="text-n2f-text">Communication:</strong> Sending important service updates (no marketing)</li>
              <li><strong className="text-n2f-text">Improvement:</strong> Analyzing aggregate usage patterns to improve the Service</li>
            </ul>
          </section>

          {/* 5. Data Security */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">5. Data Security</h2>
            <p className="mb-4">We implement comprehensive security measures:</p>

            <div className="space-y-4">
              <div className="bg-n2f-elevated rounded-lg p-4">
                <h3 className="font-medium text-n2f-text mb-2">Encryption</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li><strong>In transit:</strong> All communications use HTTPS with TLS 1.3</li>
                  <li><strong>At rest:</strong> Sensitive data encrypted with AES-256-GCM</li>
                  <li><strong>Passwords:</strong> PBKDF2 with 100,000 iterations and unique salts</li>
                  <li><strong>API keys:</strong> SHA-256 hashed (one-way, irreversible)</li>
                </ul>
              </div>

              <div className="bg-n2f-elevated rounded-lg p-4">
                <h3 className="font-medium text-n2f-text mb-2">Infrastructure</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li><strong>Hosting:</strong> Cloudflare Workers (edge computing, no persistent servers)</li>
                  <li><strong>Database:</strong> Cloudflare D1 (SQLite at the edge)</li>
                  <li><strong>Rate limiting:</strong> Cloudflare KV (distributed key-value store)</li>
                  <li><strong>DDoS protection:</strong> Built-in Cloudflare protection</li>
                </ul>
              </div>

              <div className="bg-n2f-elevated rounded-lg p-4">
                <h3 className="font-medium text-n2f-text mb-2">Access Controls</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li><strong>2FA:</strong> Optional TOTP-based two-factor authentication</li>
                  <li><strong>Sudo mode:</strong> Re-authentication required for sensitive actions</li>
                  <li><strong>API key scoping:</strong> Keys are tied to specific connections</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 6. Data Sharing */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">6. Data Sharing & Third Parties</h2>
            <p className="mb-4">We share data only with essential service providers:</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-n2f-border">
                    <th className="text-left py-2 text-n2f-text">Provider</th>
                    <th className="text-left py-2 text-n2f-text">Purpose</th>
                    <th className="text-left py-2 text-n2f-text">Data Shared</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-n2f-border">
                  <tr>
                    <td className="py-2">Cloudflare</td>
                    <td className="py-2">Hosting, CDN, DDoS protection</td>
                    <td className="py-2">All service data</td>
                  </tr>
                  <tr>
                    <td className="py-2">Stripe</td>
                    <td className="py-2">Payment processing</td>
                    <td className="py-2">Email, subscription data</td>
                  </tr>
                  <tr>
                    <td className="py-2">GitHub/Google</td>
                    <td className="py-2">OAuth authentication</td>
                    <td className="py-2">OAuth tokens (temporary)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4">
              <strong className="text-n2f-text">We do NOT share data with:</strong> Advertisers, data brokers, analytics companies, or any third party for marketing purposes.
            </p>
          </section>

          {/* 7. Data Retention */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">7. Data Retention</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-n2f-border">
                    <th className="text-left py-2 text-n2f-text">Data Type</th>
                    <th className="text-left py-2 text-n2f-text">Retention Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-n2f-border">
                  <tr>
                    <td className="py-2">Account data</td>
                    <td className="py-2">Until account deletion</td>
                  </tr>
                  <tr>
                    <td className="py-2">Connection data</td>
                    <td className="py-2">Until connection or account deletion</td>
                  </tr>
                  <tr>
                    <td className="py-2">Usage logs</td>
                    <td className="py-2">90 days (auto-deleted)</td>
                  </tr>
                  <tr>
                    <td className="py-2">Error logs</td>
                    <td className="py-2">30 days (auto-deleted)</td>
                  </tr>
                  <tr>
                    <td className="py-2">Deleted account data</td>
                    <td className="py-2">30 days (grace period), then permanently deleted</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 8. Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">8. Your Rights</h2>
            <p className="mb-4">Under GDPR, CCPA, and Thailand's PDPA, you have the following rights:</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-n2f-elevated rounded-lg p-4">
                <h3 className="font-medium text-n2f-text mb-2">Access</h3>
                <p className="text-sm">Request a copy of your personal data. Available in Dashboard → Settings.</p>
              </div>
              <div className="bg-n2f-elevated rounded-lg p-4">
                <h3 className="font-medium text-n2f-text mb-2">Rectification</h3>
                <p className="text-sm">Update inaccurate data directly in your account settings.</p>
              </div>
              <div className="bg-n2f-elevated rounded-lg p-4">
                <h3 className="font-medium text-n2f-text mb-2">Erasure</h3>
                <p className="text-sm">Delete your account and all associated data from Settings.</p>
              </div>
              <div className="bg-n2f-elevated rounded-lg p-4">
                <h3 className="font-medium text-n2f-text mb-2">Portability</h3>
                <p className="text-sm">Export your data in a machine-readable format (JSON).</p>
              </div>
              <div className="bg-n2f-elevated rounded-lg p-4">
                <h3 className="font-medium text-n2f-text mb-2">Restriction</h3>
                <p className="text-sm">Request limitation of processing by contacting us.</p>
              </div>
              <div className="bg-n2f-elevated rounded-lg p-4">
                <h3 className="font-medium text-n2f-text mb-2">Objection</h3>
                <p className="text-sm">Object to processing for specific purposes by contacting us.</p>
              </div>
            </div>
          </section>

          {/* 9. Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">9. Cookies & Local Storage</h2>
            <p className="mb-3">We use minimal browser storage:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-n2f-text">localStorage (JWT token):</strong> Stores your authentication token. Essential for login persistence. Cleared on logout.
              </li>
              <li>
                <strong className="text-n2f-text">No tracking cookies:</strong> We do not use any third-party tracking cookies.
              </li>
              <li>
                <strong className="text-n2f-text">No advertising cookies:</strong> We do not serve ads or use advertising networks.
              </li>
            </ul>
          </section>

          {/* 10. International Transfers */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">10. International Data Transfers</h2>
            <p>
              Your data is processed on Cloudflare's global edge network. Cloudflare complies with EU-US Data Privacy Framework and maintains appropriate safeguards for international data transfers. By using the Service, you consent to this processing.
            </p>
          </section>

          {/* 11. Account Deletion */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">11. Account Deletion</h2>
            <p className="mb-3">You can delete your account at any time:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Go to <strong className="text-n2f-text">Dashboard → Settings</strong></li>
              <li>Scroll to <strong className="text-n2f-text">Delete Account</strong> section</li>
              <li>Confirm deletion (requires password or typing "delete" for OAuth users)</li>
              <li>Your account is immediately marked as deleted</li>
              <li>All data is permanently purged after 30 days</li>
            </ol>
            <p className="mt-3 text-n2f-text-muted text-sm">
              During the 30-day grace period, you can contact us to recover your account.
            </p>
          </section>

          {/* 12. Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">12. Children's Privacy</h2>
            <p>
              The Service is not intended for users under 16 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.
            </p>
          </section>

          {/* 13. Changes */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">13. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification at least <strong className="text-n2f-text">14 days</strong> before they take effect. Continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 14. Contact */}
          <section>
            <h2 className="text-xl font-semibold text-n2f-text mb-4">14. Contact Information</h2>
            <p className="mb-4">For privacy-related questions or to exercise your rights:</p>
            <div className="bg-n2f-elevated rounded-lg p-4 flex items-center gap-3">
              <Mail className="h-5 w-5 text-n2f-accent" />
              <div>
                <p className="text-n2f-text font-medium">Email</p>
                <a href="mailto:privacy@node2flow.net" className="text-n2f-accent hover:underline">
                  privacy@node2flow.net
                </a>
              </div>
            </div>
            <p className="mt-4 text-sm text-n2f-text-muted">
              We aim to respond to all privacy requests within 30 days.
            </p>
          </section>
        </div>

        {/* Footer navigation */}
        {!user && (
          <div className="mt-12 pt-8 border-t border-n2f-border flex justify-between">
            <Link to="/terms" className="text-n2f-accent hover:underline">
              ← Terms of Service
            </Link>
            <Link to="/" className="text-n2f-accent hover:underline">
              Back to Home →
            </Link>
          </div>
        )}
    </>
  );

  if (user) {
    return <div className="space-y-6">{content}</div>;
  }

  return (
    <div className="min-h-screen bg-n2f-bg">
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {content}
      </main>
    </div>
  );
}
