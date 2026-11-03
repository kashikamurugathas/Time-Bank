import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Mail, Send, Phone, MapPin, CheckCircle2 } from 'lucide-react';

export const FaqContactSection: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const faqs = [
    {
      q: 'What is a Time Credit and how is it valued?',
      a: 'In Time Bank, 1 hour of any service equals 1 Time Credit. Everyone’s hour is valued equally, regardless of whether you teach advanced computer coding, help with organic gardening, repair an electrical switch, or offer companionship to an elder.'
    },
    {
      q: 'Why is administrator approval mandatory for every new registration?',
      a: 'To safeguard our community, every newly registered account starts in PENDING status. The administrator verifies details and qualifications before granting access. This prevents fake profiles, spam, and protects member trust.'
    },
    {
      q: 'Can Time Credits be converted into cash or Rupees?',
      a: 'No. Time Credits cannot be converted into money under any circumstances. Time banking is an asset-based reciprocity system designed to strengthen community networks, not a financial marketplace.'
    },
    {
      q: 'How does Time Bank protect my exact residential location?',
      a: 'Your exact home coordinates or house number are never shown publicly or to other members. The platform calculates distance using the Haversine formula and displays approximate distances (e.g. "2.4 km away in Nallur, Jaffna") for privacy.'
    },
    {
      q: 'When are time credits transferred between members?',
      a: 'Credits are only transferred when BOTH members confirm completion in their booking dashboard. If either party raises an issue, credits remain safely in hold until resolved.'
    },
    {
      q: 'What is "My Learning Journey"?',
      a: 'A dedicated dashboard feature where you can document newly acquired skills, upload certificates, track your progress percentage, and obtain a Verified Skill badge from administrators.'
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 4000);
  };

  return (
    <section className="py-20 bg-[#F7F7FB]" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* FAQ Column */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest px-3 py-1 rounded-full bg-[#F2ECFF] text-[#6C3FC5] border border-[#6C3FC5]/20">
                Common Questions
              </span>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#452080] tracking-tight mt-3">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((f, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-[#EAE7F6] overflow-hidden transition-all shadow-xs"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-display font-bold text-sm text-[#452080] hover:text-[#6C3FC5]"
                    >
                      <span>{f.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#6C3FC5] shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                        {f.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact Form Column */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-8 border border-[#EAE7F6] shadow-md space-y-6">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest px-3 py-1 rounded-full bg-[#F2ECFF] text-[#6C3FC5] border border-[#6C3FC5]/20">
                  We are here for you
                </span>
                <h3 className="font-display font-extrabold text-xl text-[#452080] tracking-tight mt-2">
                  Get in Touch With Time Bank
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Have questions about community chapter setup or membership verification? Send us a message.
                </p>
              </div>

              {contactSubmitted ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-sm text-emerald-900">Message Received!</h4>
                  <p className="text-xs text-emerald-700">Thank you for reaching out. Our community coordinator will respond to your email within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Kasun or Ananya"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Starting a community chapter in Batticaloa"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Message</label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="How can we assist you or your neighborhood group?"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold transition-all shadow-md shadow-[#6C3FC5]/20 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Inquiry</span>
                  </button>
                </form>
              )}

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#6C3FC5]" />
                  <a href="tel:0766695355" className="hover:text-[#6C3FC5] transition-colors font-medium text-gray-700">
                    0766695355
                  </a>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#6C3FC5]" />
                  <a href="mailto:mamurugathas@gmail.com" className="hover:text-[#6C3FC5] transition-colors font-medium text-gray-700">
                    mamurugathas@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
