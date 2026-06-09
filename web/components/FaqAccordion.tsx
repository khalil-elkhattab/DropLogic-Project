'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqItems = [
  {
    question: 'Will DropLogic get my ad accounts banned?',
    answer:
      'No. DropLogic generates original, policy-compliant creatives and copy — we do not scrape competitor ads or violate platform terms. Our AI outputs are unique to your brand, helping you avoid duplicate-content flags that commonly trigger Meta and TikTok ad rejections.',
  },
  {
    question: 'How fast does video rendering actually take?',
    answer:
      'Most HD video renders complete in under 60 seconds on our priority queue. LTD members skip the free-tier wait line. Rendering runs on dedicated cloud infrastructure optimized for short-form vertical ads, so you can test more creatives per day without bottlenecking your launch schedule.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes. There are no lock-in contracts. You can cancel directly from your Lemon Squeezy customer portal at any time, and your access continues until the end of your current billing period. Lifetime Deal purchases are one-time — no recurring charges, ever.',
  },
  {
    question: 'Is my store data and account information safe?',
    answer:
      'Absolutely. We use Clerk for secure authentication, encrypt data in transit, and never sell your information. Payment details are handled entirely by Lemon Squeezy — DropLogic never stores your card number. See our Privacy Policy for full details.',
  },
  {
    question: 'Do you support international dropshippers?',
    answer:
      'Yes. DropLogic is built for global sellers. Checkout supports international payments via Lemon Squeezy, and our 14-day money-back guarantee applies worldwide. Product analysis works across US, EU, UK, and APAC market signals.',
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section id="faq" className="px-6 md:px-8 py-20 md:py-32 bg-[#fafafa] border-y border-black/[0.05]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-[0.3em] mb-3">
            // FAQ
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-4">
            Questions dropshippers ask us
          </h2>
          <p className="text-gray-500 text-sm md:text-base max-w-lg mx-auto">
            Straight answers on ad safety, speed, billing, and security — before you commit.
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden transition-shadow hover:shadow-sm"
              >
                <h3>
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${index}`}
                    id={`faq-trigger-${index}`}
                    className="w-full flex items-center justify-between gap-4 px-5 md:px-6 py-4 md:py-5 text-left font-bold text-sm md:text-base text-black hover:bg-gray-50/50 transition"
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-blue-600 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <div
                  id={`faq-panel-${index}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${index}`}
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 md:px-6 pb-5 text-gray-500 text-sm leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
