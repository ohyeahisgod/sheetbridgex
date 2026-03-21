import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — SheetBridgeX',
}

const EFFECTIVE_DATE = 'March 21, 2026'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">SB</span>
            </div>
            <span className="text-[14px] font-semibold text-gray-900">SheetBridgeX</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-[32px] font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-[14px] text-gray-400">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="space-y-10 text-[15px] text-gray-600 leading-relaxed">

          <section>
            <p>
              This Privacy Policy explains how SheetBridgeX ("we", "us", or "our") collects, uses,
              and protects your information when you use our Service. We take your privacy seriously
              and are committed to being transparent about our practices.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <p className="mb-3">We collect the following types of information:</p>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-800 mb-1">Account information</p>
                <p className="text-gray-500">
                  Your email address and name when you sign up. Used to manage your account and send
                  important service updates.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-800 mb-1">OAuth tokens</p>
                <p className="text-gray-500">
                  Access tokens from Notion and Google, granted when you connect your accounts.
                  These tokens are stored securely and used only to perform the sync operations
                  you configure.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-800 mb-1">Sync configuration</p>
                <p className="text-gray-500">
                  Settings you define: which Notion database to sync, which Google Sheet to write to,
                  field mappings, and sync interval. Stored to execute your automated syncs.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-800 mb-1">Usage data</p>
                <p className="text-gray-500">
                  Aggregate counts of sync runs and rows processed, used for billing limits and
                  service analytics. We do not read or store the content of your Notion or Sheets data
                  beyond what is required to perform a sync.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-800 mb-1">Billing information</p>
                <p className="text-gray-500">
                  Payments are handled by Stripe. We do not store your full card details.
                  We receive a customer ID and subscription status from Stripe.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <ul className="space-y-1.5 list-disc list-inside text-gray-500">
              <li>To provide and maintain the sync Service</li>
              <li>To authenticate you and manage your account</li>
              <li>To enforce usage limits based on your plan</li>
              <li>To send transactional emails (signup, billing receipts, support replies)</li>
              <li>To improve the Service through aggregate, anonymized analytics</li>
            </ul>
            <p className="mt-3 text-gray-500">
              We do not sell, rent, or share your personal information with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">3. Data Storage and Security</h2>
            <p>
              Your data is stored on Supabase (PostgreSQL), hosted on AWS infrastructure.
              We use row-level security to ensure users can only access their own data.
              OAuth tokens are stored encrypted. We use HTTPS for all communications.
            </p>
            <p className="mt-3">
              While we implement industry-standard security measures, no system is perfectly secure.
              Please use a strong, unique password and notify us immediately if you suspect unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">4. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services to operate SheetBridgeX:</p>
            <div className="space-y-2">
              {[
                { name: 'Supabase', purpose: 'Database and authentication' },
                { name: 'Stripe', purpose: 'Payment processing' },
                { name: 'Vercel', purpose: 'Application hosting' },
                { name: 'Resend', purpose: 'Transactional email delivery' },
                { name: 'Notion API', purpose: 'Reading your Notion databases' },
                { name: 'Google Sheets API', purpose: 'Writing to your Google Sheets' },
              ].map(({ name, purpose }) => (
                <div key={name} className="flex gap-3 text-[14px]">
                  <span className="font-medium text-gray-800 w-36 flex-shrink-0">{name}</span>
                  <span className="text-gray-500">{purpose}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-gray-500">
              Each service has its own privacy policy governing their handling of data.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">5. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. Sync logs are
              retained for 90 days. If you delete your account, we will delete your personal data
              within 30 days, except where we are required to retain it for legal or billing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">6. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="space-y-1.5 list-disc list-inside text-gray-500">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Revoke OAuth access to Notion or Google at any time via their respective settings</li>
              <li>Export your sync configuration data</li>
            </ul>
            <p className="mt-3 text-gray-500">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:hello@satosushi.co" className="text-gray-900 underline underline-offset-2">
                hello@satosushi.co
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">7. Cookies</h2>
            <p>
              We use only session cookies necessary for authentication. We do not use tracking
              cookies or third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material
              changes by email or by posting a notice on the Service. Continued use after changes
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">9. Contact</h2>
            <p>
              If you have questions or concerns about this Privacy Policy or our data practices,
              please contact us at{' '}
              <a href="mailto:hello@satosushi.co" className="text-gray-900 underline underline-offset-2">
                hello@satosushi.co
              </a>.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 py-8 mt-16">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between text-[12px] text-gray-400">
          <span>© 2026 SheetBridgeX. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
