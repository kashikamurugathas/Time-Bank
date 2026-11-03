import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Skill } from '../../types/index.ts';
import {
  Laptop, Code, Palette, Utensils, Sprout, Languages,
  Calculator, Camera, Zap, Wrench, Smartphone, Scissors,
  HeartPulse, Heart, Hammer, Music, ArrowRight, Search
} from 'lucide-react';

interface CommunitySkillsSectionProps {
  onSelectSkill: (skillName: string) => void;
}

export const CommunitySkillsSection: React.FC<CommunitySkillsSectionProps> = ({ onSelectSkill }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Map category to icon
  const getSkillIcon = (name: string, category: string) => {
    const n = name.toLowerCase();
    if (n.includes('computer')) return Laptop;
    if (n.includes('web') || n.includes('coding')) return Code;
    if (n.includes('graphic') || n.includes('design')) return Palette;
    if (n.includes('cook') || n.includes('baking')) return Utensils;
    if (n.includes('garden') || n.includes('agriculture')) return Sprout;
    if (n.includes('language') || n.includes('english')) return Languages;
    if (n.includes('math')) return Calculator;
    if (n.includes('photo') || n.includes('video')) return Camera;
    if (n.includes('elec')) return Zap;
    if (n.includes('plumb')) return Wrench;
    if (n.includes('phone')) return Smartphone;
    if (n.includes('sewing') || n.includes('tailor')) return Scissors;
    if (n.includes('first aid')) return HeartPulse;
    if (n.includes('elderly') || n.includes('care')) return Heart;
    if (n.includes('carpent') || n.includes('wood')) return Hammer;
    if (n.includes('music') || n.includes('guitar')) return Music;
    return Laptop;
  };

  useEffect(() => {
    const fetchSkills = async () => {
      setLoading(true);
      try {
        const data = await api.getCatalogSkills();
        setSkills(data || []);
        const catRes = await api.getCategories();
        setCategories(['ALL', ...catRes.map((c: any) => c.category)]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  const filteredSkills = skills.filter((s) => {
    const matchCat = selectedCat === 'ALL' || s.category === selectedCat;
    const matchSearch = !search.trim() ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <section className="py-20 bg-white" id="explore-skills">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs uppercase font-extrabold tracking-widest px-3 py-1 rounded-full bg-[#F2ECFF] text-[#6C3FC5] border border-[#6C3FC5]/20">
            Skill Catalog &bull; Equal Exchange
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#452080] tracking-tight">
            Discover Community Talents &amp; Skills
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Every skill is valued at 1 Time Credit per hour. Learn computer literacy, repair household appliances, grow organic vegetables, or learn a new language.
          </p>
        </div>

        {/* Filter and Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
            {categories.map((c, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCat(c)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors shrink-0 ${
                  selectedCat === c
                    ? 'bg-[#6C3FC5] text-white shadow-md shadow-[#6C3FC5]/20'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {c === 'ALL' ? 'All Categories' : c}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skill by name..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
            />
          </div>
        </div>

        {/* Skills Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredSkills.map((skill) => {
            const Icon = getSkillIcon(skill.name, skill.category);
            return (
              <div
                key={skill.id}
                onClick={() => onSelectSkill(skill.name)}
                className="bg-[#F7F7FB] rounded-3xl p-6 border border-[#EAE7F6] hover:border-[#6C3FC5]/50 hover:bg-white hover:shadow-xl hover:shadow-[#6C3FC5]/8 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#F2ECFF] group-hover:bg-[#6C3FC5] text-[#6C3FC5] group-hover:text-white flex items-center justify-center mb-4 transition-colors shadow-xs">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded-md">
                    {skill.category}
                  </span>
                  <h3 className="font-display font-bold text-base text-[#452080] group-hover:text-[#6C3FC5] transition-colors mt-2 mb-1.5">
                    {skill.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {skill.description || 'Verified community skill exchange offered by local members.'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-200/60 flex items-center justify-between text-xs font-bold text-[#6C3FC5]">
                  <span>1 Hour = 1 Credit</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
