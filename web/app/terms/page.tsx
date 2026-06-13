import type { Metadata } from 'next';
import LegalPageLayout, { LegalSection } from '@/components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Terms of Service — DropLogic',
  description: 'Terms and conditions for using the DropLogic platform.',
};

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="June 8, 2026">
      <LegalSection title="1. Agreement to Terms">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of the DropLogic website,
          applications, and related services (collectively, the &quot;Service&quot;) operated by DropLogic
          (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By creating an account or using the Service, you agree to be
          bound by these Terms and our{' '}
          <a href="/privacy" className="text-violet-400 underline underline-offset-2 hover:text-violet-300">
            Privacy Policy
          </a>
          .
        </p>
        <p>
          If you are using the Service on behalf of a company, you represent that you have authority to
          bind that organization to these Terms.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <p>
          You must be at least 18 years old (or the age of majority in your jurisdiction) to use DropLogic.
          You agree to provide accurate registration information and keep your account credentials secure.
          You are responsible for all activity under your account.
        </p>
      </LegalSection>

      <LegalSection title="3. Description of Service">
        <p>
          DropLogic provides software tools for product research, AI-assisted content generation, video
          rendering, and related e-commerce workflow automation. Features, limits, and availability may
          change over time. We may add, modify, or discontinue features with reasonable notice where
          practicable.
        </p>
      </LegalSection>

      <LegalSection title="4. Accounts and Subscriptions">
        <p>
          Access to certain features requires a paid plan, credit purchase, or lifetime license (&quot;LTD&quot;).
          Payments are processed by Lemon Squeezy, our authorized reseller and merchant of record. By
          purchasing, you also agree to Lemon Squeezy&apos;s applicable terms and policies.
        </p>
        <p>
          Pricing, plan inclusions, and usage limits are displayed at checkout or within your account
          dashboard. Failure to pay applicable fees may result in suspension or downgrade of your account.
        </p>
      </LegalSection>

      <LegalSection id="refund-policy" title="5. 14-Day Money-Back Guarantee">
        <p>
          We want you to feel confident purchasing DropLogic, wherever you are in the world. If you are not
          satisfied with your purchase for any reason, you may request a full refund within{' '}
          <strong className="text-zinc-100">14 days</strong> of your original payment date.
        </p>
        <p>This 14-Day Money-Back Guarantee applies to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Lifetime Deal (LTD) purchases</li>
          <li>One-time credit pack purchases</li>
          <li>Initial subscription payments (first billing cycle only)</li>
        </ul>
        <p>To request a refund:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Email{' '}
            <a
              href="mailto:support@droplogic.com"
              className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
            >
              support@droplogic.com
            </a>{' '}
            from the email address associated with your account
          </li>
          <li>Include your order number or the email used at checkout</li>
          <li>Briefly describe the reason for your request (optional but helpful)</li>
        </ol>
        <p>
          Approved refunds are processed to your original payment method within 5–10 business days, depending
          on your bank or card issuer. After the 14-day window, all sales are generally final except where
          required by applicable consumer protection laws in your jurisdiction.
        </p>
        <p>
          We reserve the right to deny refund requests in cases of abuse, repeated refund claims, or
          violations of these Terms.
        </p>
      </LegalSection>

      <LegalSection title="6. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Use the Service for unlawful, fraudulent, or harmful purposes</li>
          <li>Reverse engineer, scrape, or attempt to extract source code or models beyond permitted API use</li>
          <li>Interfere with or disrupt the integrity or performance of the Service</li>
          <li>Share account credentials or resell access without authorization</li>
          <li>Upload content that infringes intellectual property or privacy rights of others</li>
          <li>Use automated means to abuse rate limits, credits, or free-tier access</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Intellectual Property">
        <p>
          DropLogic and its licensors retain all rights, title, and interest in the Service, including
          software, branding, documentation, and underlying technology. You retain ownership of content
          you submit. You grant us a limited license to process your content solely to provide and improve
          the Service.
        </p>
        <p>
          Output generated by AI features is provided &quot;as is.&quot; You are responsible for reviewing and
          ensuring your use of generated content complies with applicable laws and platform policies.
        </p>
      </LegalSection>

      <LegalSection title="8. Third-Party Services">
        <p>
          The Service integrates with third-party providers (including authentication, payment, hosting,
          and AI services). We are not responsible for third-party websites, tools, or policies. Your use of
          those services is subject to their respective terms.
        </p>
      </LegalSection>

      <LegalSection title="9. Disclaimers">
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER
          EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT
          RESULTS WILL MEET YOUR BUSINESS OBJECTIVES.
        </p>
      </LegalSection>

      <LegalSection title="10. Limitation of Liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, DROPLOGIC SHALL NOT BE LIABLE FOR ANY INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL,
          ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM SHALL NOT EXCEED THE
          AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED US DOLLARS
          (USD $100), WHICHEVER IS GREATER.
        </p>
      </LegalSection>

      <LegalSection title="11. Indemnification">
        <p>
          You agree to indemnify and hold harmless DropLogic and its officers, directors, employees, and
          agents from any claims, damages, losses, or expenses (including reasonable legal fees) arising
          from your use of the Service, your content, or your violation of these Terms.
        </p>
      </LegalSection>

      <LegalSection title="12. Termination">
        <p>
          You may stop using the Service at any time. We may suspend or terminate your access if you breach
          these Terms, fail to pay fees, or if required for legal or security reasons. Upon termination,
          your right to use the Service ceases immediately. Provisions that by nature should survive
          (including payment obligations, disclaimers, and limitations of liability) will survive
          termination.
        </p>
      </LegalSection>

      <LegalSection title="13. Governing Law">
        <p>
          These Terms are governed by the laws of the jurisdiction in which DropLogic is established,
          without regard to conflict-of-law principles. Any disputes shall be resolved in the courts of
          that jurisdiction, except where mandatory consumer protection laws in your country require
          otherwise.
        </p>
      </LegalSection>

      <LegalSection title="14. Changes to Terms">
        <p>
          We may update these Terms from time to time. Continued use of the Service after changes become
          effective constitutes acceptance of the revised Terms. We will notify you of material changes via
          email or in-app notice where appropriate.
        </p>
      </LegalSection>

      <LegalSection title="15. Contact">
        <p>
          Questions about these Terms or refund requests? Contact us at{' '}
          <a
            href="mailto:support@droplogic.com"
            className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
          >
            support@droplogic.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
