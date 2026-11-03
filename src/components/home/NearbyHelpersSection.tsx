import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Star, ShieldCheck, Clock, Search, ChevronRight, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.ts';
import { HelperRecommendation } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface NearbyHelpersSectionProps {
  onSelectHelper?: (helper: HelperRecommendation) => void;
  onRequestHelp?: (skillName?: string) => void;
}

export const NearbyHelpersSection: React.FC<NearbyHelpersSectionProps> = ({ onSelectHelper, onRequestHelp }) => {
  const { user, setShowLoginModal } = useAuth();
  const [helpers, setHelpers] = useState<HelperRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState('Nallur, Jaffna (Default)');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 9.6749, lng: 80.0292 });
  const [radiusKm, setRadiusKm] = useState<number>(50);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [categories, setCategories] = useState<string[]>([]);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'granted' | 'denied'>('idle');
  const [suggestion, setSuggestion] = useState<string | null>(null);

  // Preset location hubs in Sri Lanka
  const presets = [
    { name: 'Jaffna (Nallur)', lat: 9.6749, lng: 80.0292 },
    { name: 'Colombo (Colpetty)', lat: 6.9034, lng: 79.8542 },
    { name: 'Kandy (City Center)', lat: 7.2906, lng: 80.6337 },
    { name: 'Galle (Fort)', lat: 6.0329, lng: 80.2168 }
  ];

  const fetchNearby = async (lat: number, lng: number, rad: number, search?: string, cat?: string) => {
    setLoading(true);
    try {
      const data = await api.getNearbyHelpers({
        lat,
        lng,
        radius: rad,
        search: search || undefined,
        category: cat !== 'ALL' ? cat : undefined,
        excludeUserId: user?.id
      });
      setHelpers(data.helpers || []);
      setSuggestion(data.suggestion || null);
    } catch (err) {
      console.error('Failed to fetch nearby helpers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCats = async () => {
    try {
      const res = await api.getCategories();
      setCategories(['ALL', ...res.map((c: any) => c.category)]);
    } catch {
      setCategories(['ALL', 'Education', 'Technology', 'Culinary', 'Home & Garden', 'Trades & Maintenance', 'Caregiving']);
    }
  };

  useEffect(() => {
    fetchCats();
    fetchNearby(coords.lat, coords.lng, radiusKm, searchKeyword, selectedCategory);
  }, []);

  const handleRequestGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(newCoords);
        setLocationName('Your Current GPS Location');
        setGeoStatus('granted');
        fetchNearby(newCoords.lat, newCoords.lng, radiusKm, searchKeyword, selectedCategory);
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err.message);
        setGeoStatus('denied');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handlePresetSelect = (preset: { name: string; lat: number; lng: number }) => {
    setCoords({ lat: preset.lat, lng: preset.lng });
    setLocationName(preset.name);
    setGeoStatus('idle');
    fetchNearby(preset.lat, preset.lng, radiusKm, searchKeyword, selectedCategory);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNearby(coords.lat, coords.lng, radiusKm, searchKeyword, selectedCategory);
  };

  return (
    <section className="py-20 bg-[#F7F7FB]" id="nearby-helpers">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2ECFF] text-[#6C3FC5] text-xs font-bold border border-[#6C3FC5]/20">
              <Navigation className="w-3.5 h-3.5" />
              <span>Haversine Proximity Recommendation</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#452080] tracking-tight">
              Find Verified Helpers Near You
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Discover approved community members in your neighborhood offering teaching, repairs, gardening, and caregiving. Distance is calculated securely without exposing residential street addresses.
            </p>
          </div>

          {/* GPS Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleRequestGeolocation}
              disabled={geoStatus === 'locating'}
              className="px-5 py-3 rounded-2xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#6C3FC5]/20 transition-all disabled:opacity-50"
            >
              <Navigation className={`w-4 h-4 ${geoStatus === 'locating' ? 'animate-spin' : ''}`} />
              <span>{geoStatus === 'locating' ? 'Detecting Location...' : 'Use My Current Geolocation'}</span>
            </button>
          </div>
        </div>

        {/* Location Hub Presets & Filters Bar */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-sm mb-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#6C3FC5]" />
              <span className="text-xs font-bold text-gray-700">Active Location:</span>
              <span className="text-xs font-extrabold text-[#452080] bg-[#F2ECFF] px-2.5 py-1 rounded-lg">
                {locationName}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-500 font-medium mr-1">Quick Select:</span>
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetSelect(p)}
                  className={`text-xs px-2.5 py-1 rounded-xl transition-colors font-semibold ${
                    locationName === p.name ? 'bg-[#6C3FC5] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Search inputs and radius slider */}
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Keyword */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Search skills (e.g. computer, repair, cooking, math)..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
              />
            </div>

            {/* Category */}
            <div className="md:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  fetchNearby(coords.lat, coords.lng, radiusKm, searchKeyword, e.target.value);
                }}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] text-gray-800 font-medium"
              >
                {categories.map((c, i) => (
                  <option key={i} value={c}>{c === 'ALL' ? 'All Skill Categories' : c}</option>
                ))}
              </select>
            </div>

            {/* Radius Slider */}
            <div className="md:col-span-4 flex items-center gap-3">
              <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">Radius:</span>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={radiusKm}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setRadiusKm(val);
                  fetchNearby(coords.lat, coords.lng, val, searchKeyword, selectedCategory);
                }}
                className="w-full accent-[#6C3FC5] cursor-pointer"
              />
              <span className="text-xs font-bold text-[#6C3FC5] min-w-[50px] text-right">
                {radiusKm} km
              </span>
            </div>
          </form>

          {geoStatus === 'denied' && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Browser location permission was denied. Using manual city selection ({locationName}).</span>
            </div>
          )}
        </div>

        {/* Helpers Result Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#6C3FC5] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-gray-600">Calculating distances and finding nearest helpers...</p>
          </div>
        ) : helpers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE7F6] space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#F2ECFF] text-[#6C3FC5] flex items-center justify-center mx-auto">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900">No Helpers Found Within {radiusKm} km</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {suggestion || 'Try increasing your search radius to 50 km or 100 km, or select a different skill category.'}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  setRadiusKm(100);
                  fetchNearby(coords.lat, coords.lng, 100);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#6C3FC5] text-white text-xs font-bold"
              >
                Expand Radius to 100 km
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpers.map((h) => (
              <div
                key={h.userId}
                className="bg-white rounded-3xl p-6 border border-[#EAE7F6] hover:border-[#6C3FC5]/40 hover:shadow-xl hover:shadow-[#6C3FC5]/5 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top user row */}
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={h.profilePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                      alt={h.fullName}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#6C3FC5]/20 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-display font-bold text-base text-gray-900 truncate">{h.fullName}</h4>
                        <span title="Admin Verified Member">
                          <ShieldCheck className="w-4 h-4 text-[#6C3FC5] shrink-0" />
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{h.city}, {h.district}</span>
                      </p>
                      {/* Distance Badge */}
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F2ECFF] text-[#6C3FC5] text-[10px] font-extrabold">
                        <Navigation className="w-2.5 h-2.5" />
                        <span>{h.approximateDistanceDisplay}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {h.bio && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                      {h.bio}
                    </p>
                  )}

                  {/* Skills tags */}
                  <div className="space-y-2 mb-5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Offered Skills:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {h.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-semibold bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg text-gray-700 flex items-center gap-1"
                        >
                          <span>{s.skillName}</span>
                          <span className="text-[9px] text-[#6C3FC5] font-bold">({s.experienceLevel})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rating & Action */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center text-amber-500">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    </div>
                    <span className="text-xs font-bold text-gray-900">{h.ratingAvg.toFixed(1)}</span>
                    <span className="text-[10px] text-gray-400">({h.completedServicesCount} services)</span>
                  </div>

                  <button
                    onClick={() => {
                      if (!user) {
                        setShowLoginModal(true);
                      } else if (onSelectHelper) {
                        onSelectHelper(h);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <span>Request Help</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
