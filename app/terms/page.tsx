import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service — SheetBridgeX',
}

const EFFECTIVE_DATE = 'March 21, 2026'

export default function TermsPage() {
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
          <h1 className="text-[32px] font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-[14px] text-gray-400">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="prose-custom space-y-10 text-[15px] text-gray-600 leading-relaxed">

          <section>
            <p>
              These Terms of Service ("Terms") govern your access to and use of SheetBridgeX ("Service"),
              operated by the SheetBridgeX team ("we", "us", or "our"). By accessing or using the Service,
              you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">1. Use of the Service</h2>
            <p>
              SheetBridgeX provides an automated data sync service between Notion databases and Google Sheets.
              You may use the Service only for lawful purposes and in accordance with these Terms.
              You agree not to:
            </p>
            <ul className="mt-3 space-y-1.5 list-disc list-inside text-gray-500">
              <li>Use the Service to transmit unlawful, harmful, or abusive content</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Resell or sublicense the Service without prior written consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">2. Accounts</h2>
            <p>
              You must create an account to use the Service. You are responsible for maintaining the
              confidentiality of your account credentials and for all activities that occur under your account.
              You agree to notify us immediately at{' '}
              <a href="mailto:hello@satosushi.co" className="text-gray-900 underline underline-offset-2">hello@satosushi.co</a>{' '}
              if you become aware of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">3. Subscriptions and Billing</h2>
            <p>
              Some features of the Service require a paid subscription. Payments are processed by Stripe.
              By subscribing, you authorize us to charge your payment method on a recurring basis.
              Subscriptions automatically renew unless cancelled before the renewal date.
              Refunds are handled on a case-by-case basis — contact us at{' '}
              <a href="mailto:hello@satosushi.co" className="text-gray-900 underline underline-offset-2">hello@satosushi.co</a>.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">4. Third-Party Integrations</h2>
            <p>
              The Service integrates with Notion and Google Sheets via OAuth. Your use of those platforms
              is governed by their respective terms of service. We are not responsible for any actions or
              policies of those third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">5. Data and Privacy</h2>
            <p>
              We access only the data necessary to perform the sync operations you configure. We do not
              sell your data to third parties. Please review our{' '}
              <Link href="/privacy" className="text-gray-900 underline underline-offset-2">Privacy Policy</Link>{' '}
              for details on how we handle your information.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">6. Service Availability</h2>
            <p>
              We strive to maintain high availability but do not guarantee uninterrupted access to the Service.
              We may modify, suspend, or discontinue any part of the Service at any time with reasonable notice.
              We are not liable for any downtime, data loss, or sync failures.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">7. Intellectual Property</h2>
            <p>
              All content, code, and materials comprising the Service are owned by or licensed to us.
              Your data remains your own. By using the Service, you grant us a limited license to process
              your data solely to provide the sync functionality.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use of the Service, including
              any data loss or sync errors.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">9. Termination</h2>
            <p>
              You may cancel your account at any time. We reserve the right to suspend or terminate
              your access to the Service for violation of these Terms or for any other reason at our
              sole discretion, with or without notice.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">10. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of significant changes
              by posting the updated Terms and updating the effective date. Continued use of the Service
              after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-gray-900 mb-3">11. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at{' '}
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
