import React, { useState, useEffect } from 'react';
import { Users, Building2, Clock, Sparkles, MapPin, Award, CheckCircle } from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const CommunityDashboard: React.FC = () => {
  const { user } = useAuth();
  const [community, setCommunity] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const commData = await api.getCommunityDetails('COMM_JAFFNA_GREEN');
        setCommunity(commData);
        const orgData = await api.getOrganizationDetails('ORG_NORTH_YOUTH');
        setOrganization(orgData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Community Section */}
      <div className="bg-white rounded-3xl p-8 border border-[#EAE7F6] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F2ECFF] text-[#6C3FC5] flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-2xl text-[#452080]">
                  {community?.name || 'Jaffna Green Innovators'}
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {community?.plan_tier || 'PLUS'} Community
                </span>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>{community?.city || 'Chundikuli'}, {community?.district || 'Jaffna'}</span>
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
          {community?.description || 'Neighborhood collective focused on permaculture, seed saving, and rooftop vegetable gardens. Members coordinate group planting days and tool lending.'}
        </p>

        {/* Community Members List */}
        <div className="space-y-3">
          <h4 className="font-display font-bold text-sm text-[#452080]">Active Chapter Members ({community?.members?.length || 2}):</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {community?.members?.map((m: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                <img
                  src={m.profile_photo_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-100 shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-bold text-xs text-gray-900 truncate">{m.full_name}</div>
                  <div className="text-[10px] text-[#6C3FC5] font-semibold">{m.role} &bull; {m.city}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Organization Section */}
      <div className="bg-white rounded-3xl p-8 border border-[#EAE7F6] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F2ECFF] text-[#6C3FC5] flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-2xl text-[#452080]">
                  {organization?.name || 'Northern Skills & Youth Foundation'}
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-[#6C3FC5]">
                  {organization?.plan_tier || 'PREMIUM'} Partner
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Registration No: <strong>{organization?.registration_no || 'GA/NP/2021/884'}</strong>
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
          {organization?.description || 'Community non-profit empowering regional youth through practical vocational skills, electronics training, and mentorship exchange.'}
        </p>

        {/* Volunteer Hours Tracking */}
        <div className="space-y-3">
          <h4 className="font-display font-bold text-sm text-[#452080]">Volunteer Hours Tracked:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {organization?.members?.map((m: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-gray-900">{m.full_name}</div>
                  <div className="text-[10px] text-gray-500">{m.role}</div>
                </div>
                <div className="text-right">
                  <span className="font-display font-black text-lg text-[#6C3FC5]">
                    {m.hours_contributed || 0} Hours
                  </span>
                  <p className="text-[10px] text-gray-400">Contributed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
