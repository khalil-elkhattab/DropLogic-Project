import type { Metadata } from 'next';
import LegalPageLayout, { LegalSection } from '@/components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy — DropLogic',
  description: 'How DropLogic collects, uses, and protects your personal data.',
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="June 8, 2026">
      <LegalSection title="1. Introduction">
        <p>
          DropLogic (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the DropLogic platform, a SaaS
          product that helps e-commerce sellers analyze products, generate creative assets, and optimize
          their workflows. This Privacy Policy explains how we collect, use, disclose, and safeguard your
          information when you visit our website or use our services.
        </p>
        <p>
          By accessing or using DropLogic, you agree to the collection and use of information in accordance
          with this policy. If you do not agree, please do not use our services.
        </p>
      </LegalSection>

      <LegalSection title="2. Information We Collect">
        <p>We may collect the following categories of personal information:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-zinc-100">Account information:</strong> name, email
            address, and authentication credentials provided through our identity provider (Clerk).
          </li>
          <li>
            <strong className="text-zinc-100">Payment information:</strong> billing details
            processed by our payment partner, Lemon Squeezy. We do not store full payment card numbers on
            our servers.
          </li>
          <li>
            <strong className="text-zinc-100">Usage data:</strong> pages visited, features
            used, session duration, IP address, browser type, device information, and referring URLs.
          </li>
          <li>
            <strong className="text-zinc-100">Content you submit:</strong> product keywords,
            links, scripts, and other inputs you provide to generate analyses or media.
          </li>
          <li>
            <strong className="text-zinc-100">Cookies and similar technologies:</strong> data
            collected through cookies, local storage, and similar tools as described in Section 8.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How We Use Your Information">
        <p>We use collected information to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Provide, operate, and maintain the DropLogic platform</li>
          <li>Create and manage your account and subscription or lifetime license</li>
          <li>Process payments and send transactional communications</li>
          <li>Improve our products, features, and user experience</li>
          <li>Monitor usage, detect fraud, and ensure platform security</li>
          <li>Respond to support requests and communicate service updates</li>
          <li>Comply with legal obligations and enforce our Terms of Service</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Legal Bases for Processing (EEA/UK Users)">
        <p>
          If you are located in the European Economic Area or United Kingdom, we process your personal
          data based on: (a) performance of a contract; (b) legitimate interests (such as security and
          product improvement); (c) your consent where required; and (d) compliance with legal obligations.
        </p>
      </LegalSection>

      <LegalSection title="5. How We Share Information">
        <p>We do not sell your personal information. We may share data with:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-zinc-100">Service providers:</strong> hosting, authentication
            (Clerk), payments (Lemon Squeezy), database (Supabase), analytics, and customer support tools
            that process data on our behalf under contractual safeguards.
          </li>
          <li>
            <strong className="text-zinc-100">Legal requirements:</strong> when required by law,
            court order, or governmental request, or to protect our rights and users&apos; safety.
          </li>
          <li>
            <strong className="text-zinc-100">Business transfers:</strong> in connection with a
            merger, acquisition, or sale of assets, subject to continued protection of your data.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Data Retention">
        <p>
          We retain personal information only as long as necessary to fulfill the purposes described in
          this policy, unless a longer retention period is required by law. When data is no longer needed,
          we delete or anonymize it in accordance with our retention practices.
        </p>
      </LegalSection>

      <LegalSection title="7. International Data Transfers">
        <p>
          DropLogic may process and store information in countries other than your own. Where required, we
          implement appropriate safeguards — such as Standard Contractual Clauses — to protect your data
          when it is transferred internationally.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="8. Cookies and Tracking">
        <p>
          We use cookies and similar technologies to authenticate sessions, remember preferences, measure
          performance, and improve our services. Essential cookies are required for the platform to
          function. You can manage cookie preferences through your browser settings. Our cookie consent
          banner allows you to acknowledge non-essential cookie use on your first visit.
        </p>
      </LegalSection>

      <LegalSection title="9. Your Rights">
        <p>
          Depending on your location, you may have the right to access, correct, delete, restrict, or port
          your personal data, and to object to or withdraw consent for certain processing. To exercise these
          rights, contact us at{' '}
          <a
            href="mailto:privacy@droplogic.com"
            className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
          >
            privacy@droplogic.com
          </a>
          . You may also lodge a complaint with your local data protection authority.
        </p>
      </LegalSection>

      <LegalSection title="10. Security">
        <p>
          We implement administrative, technical, and organizational measures designed to protect your
          information, including encryption in transit, access controls, and secure infrastructure
          practices. No method of transmission over the internet is 100% secure, and we cannot guarantee
          absolute security.
        </p>
      </LegalSection>

      <LegalSection title="11. Children&apos;s Privacy">
        <p>
          DropLogic is not intended for individuals under 16 years of age. We do not knowingly collect
          personal information from children. If you believe a child has provided us data, please contact
          us so we can delete it.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will post the revised version on this
          page and update the &quot;Last updated&quot; date. Material changes may be communicated via email or
          in-app notice.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact Us">
        <p>
          For privacy-related questions or requests, contact us at{' '}
          <a
            href="mailto:privacy@droplogic.com"
            className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
          >
            privacy@droplogic.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
