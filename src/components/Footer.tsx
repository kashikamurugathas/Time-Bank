import React from 'react';
import { Clock, Heart, Shield, MapPin, Mail, Phone } from 'lucide-react';

interface FooterProps {
  setCurrentView: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentView }) => {
  return (
    <footer className="bg-[#1E1635] text-white pt-16 pb-12 border-t border-[#452080]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C3FC5] to-[#8E51FF] flex items-center justify-center text-white shadow-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-extrabold text-2xl tracking-tight text-white">Time Bank</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
              Your Time Has Value. Share It. Earn It. Grow Together. Connecting community members to exchange skills using time credits instead of money.
            </p>
            <div className="pt-2 flex flex-col gap-2 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#8E51FF]" />
                <span>Nallur, Jaffna &amp; Colombo, Sri Lanka</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#8E51FF]" />
                <a href="mailto:mamurugathas@gmail.com" className="hover:text-white transition-colors">mamurugathas@gmail.com</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#8E51FF]" />
                <a href="tel:0766695355" className="hover:text-white transition-colors">0766695355</a>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#C4B5FD]">Platform</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <button onClick={() => setCurrentView('home')} className="hover:text-white transition-colors">Home</button>
              </li>
              <li>
                <button onClick={() => setCurrentView('how-it-works')} className="hover:text-white transition-colors">How It Works</button>
              </li>
              <li>
                <button onClick={() => setCurrentView('how-it-works/member')} className="hover:text-white transition-colors">Member Guide</button>
              </li>
              <li>
                <button onClick={() => setCurrentView('how-it-works/community-coordinator')} className="hover:text-white transition-colors">Coordinator Guide</button>
              </li>
              <li>
                <button onClick={() => setCurrentView('how-it-works/admin')} className="hover:text-white transition-colors">Administrator Guide</button>
              </li>
              <li>
                <button onClick={() => setCurrentView('skills')} className="hover:text-white transition-colors">Explore Skills</button>
              </li>
              <li>
                <button onClick={() => setCurrentView('nearby')} className="hover:text-white transition-colors">Nearby Helpers</button>
              </li>
              <li>
                <button onClick={() => setCurrentView('communities')} className="hover:text-white transition-colors">Local Communities</button>
              </li>
            </ul>
          </div>

          {/* Membership & Plans */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#C4B5FD]">Membership</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <button onClick={() => setCurrentView('membership')} className="hover:text-white transition-colors">Individual Free Plan</button>
              </li>
              <li>
                <button onClick={() => setCurrentView('membership')} className="hover:text-white transition-colors">Premium Member (LKR 500)</button>
              </li>
              <li>
                <button onClick={() => setCurrentView('membership')} className="hover:text-white transition-colors">Community Chapters</button>
              </li>
              <li>
                <button onClick={() => setCurrentView('membership')} className="hover:text-white transition-colors">Organization Plans</button>
              </li>
              <li>
                <button onClick={() => setCurrentView('wallet')} className="hover:text-white transition-colors">Time Credit Wallet</button>
              </li>
            </ul>
          </div>

          {/* Legal & Safety */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#C4B5FD]">Governance &amp; Trust</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="flex items-center gap-1.5 text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Verified Profiles</span>
              </li>
              <li>
                <span className="text-gray-400">Location Privacy Protection</span>
              </li>
              <li>
                <span className="text-gray-400">Double Confirmation Credits</span>
              </li>
              <li>
                <button onClick={() => setCurrentView('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
              </li>
              <li>
                <button onClick={() => setCurrentView('terms')} className="hover:text-white transition-colors">Terms of Exchange</button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <p>&copy; {new Date().getFullYear()} Time Bank – Community Time Exchange Platform. All rights reserved.</p>
          <div className="flex items-center gap-1 text-gray-400">
            <span>Built with care for community empowerment</span>
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 inline mx-1" />
            <span>Sri Lanka</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
