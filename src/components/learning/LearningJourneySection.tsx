import React, { useState } from 'react';
import { Sparkles, Plus, Award, CheckCircle2, Clock, Upload, Trash2, ExternalLink, X } from 'lucide-react';
import { api } from '../../services/api.ts';
import { LearningRecord } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface LearningJourneySectionProps {
  records: LearningRecord[];
  onRefresh: () => void;
}

export const LearningJourneySection: React.FC<LearningJourneySectionProps> = ({ records, onRefresh }) => {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState('Technology');
  const [status, setStatus] = useState<'CURRENTLY_LEARNING' | 'NEWLY_ACQUIRED' | 'VERIFIED'>('NEWLY_ACQUIRED');
  const [progressPercentage, setProgressPercentage] = useState(100);
  const [description, setDescription] = useState('');
  const [learningInstitution, setLearningInstitution] = useState('');
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [certificateUrl, setCertificateUrl] = useState('');
  const [workSamples, setWorkSamples] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCertificateUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.addLearningRecord({
        skillName,
        category,
        status,
        progressPercentage,
        description,
        learningInstitution,
        completionDate: status === 'NEWLY_ACQUIRED' || status === 'VERIFIED' ? completionDate : undefined,
        certificateUrl: certificateUrl || undefined,
        workSamples: workSamples || undefined
      });
      setShowAddModal(false);
      onRefresh();
      // reset
      setSkillName('');
      setDescription('');
      setLearningInstitution('');
      setCertificateUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to save learning milestone.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this learning milestone?')) {
      await api.deleteLearningRecord(id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#F2ECFF] to-[#FAF8FF] p-6 rounded-3xl border border-[#EAE7F6]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#6C3FC5]" />
            <h3 className="font-display font-extrabold text-xl text-[#452080]">My Learning Journey</h3>
          </div>
          <p className="text-xs text-gray-600 max-w-xl">
            Track new skills you are mastering after joining Time Bank. Upload certificates and work samples to get verified by administrators and showcase your growth!
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#6C3FC5]/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Learning Milestone</span>
        </button>
      </div>

      {/* Milestones Grid */}
      {records.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#EAE7F6] space-y-3">
          <Award className="w-12 h-12 text-gray-300 mx-auto" />
          <h4 className="font-display font-bold text-base text-gray-800">No Learning Milestones Yet</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Did you take a computer course, learn urban agriculture, or master a new language recently? Add it to your journey!
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-[#6C3FC5] text-white text-xs font-bold"
          >
            Add Your First Milestone
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((r) => {
            const isVerified = r.isVerifiedByAdmin === 1 || r.status === 'VERIFIED';
            const isLearning = r.status === 'CURRENTLY_LEARNING';
            return (
              <div
                key={r.id}
                className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      isVerified ? 'bg-emerald-100 text-emerald-800' :
                      isLearning ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {isVerified ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3" />}
                      <span>{isVerified ? 'Admin Verified' : isLearning ? 'Currently Learning' : 'Newly Acquired'}</span>
                    </span>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-gray-400 hover:text-rose-500 p-1"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="font-display font-bold text-base text-gray-900 mb-1">{r.skillName}</h4>
                  <span className="text-[10px] text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded">
                    {r.category}
                  </span>

                  {r.learningInstitution && (
                    <p className="text-xs text-[#6C3FC5] font-semibold mt-2">
                      {r.learningInstitution}
                    </p>
                  )}

                  {r.description && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                      {r.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-gray-700">
                      <span>Proficiency / Completion:</span>
                      <span className="text-[#6C3FC5]">{r.progressPercentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#6C3FC5] to-[#452080] rounded-full transition-all"
                        style={{ width: `${r.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Certificate or Work Samples */}
                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                  {r.certificateUrl ? (
                    <a
                      href={r.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:underline font-bold flex items-center gap-1 text-[11px]"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>View Certificate</span>
                    </a>
                  ) : (
                    <span className="text-gray-400 text-[10px]">No certificate attached</span>
                  )}
                  {r.completionDate && (
                    <span className="text-gray-400 text-[10px]">Completed: {r.completionDate}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#EAE7F6] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#6C3FC5] to-[#452080] p-6 text-white relative">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-display font-bold text-xl text-white">Add Learning Milestone</h3>
              <p className="text-xs text-purple-100/90 mt-1">Record a new skill, project, or training achievement</p>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Skill Name *</label>
                <input
                  type="text"
                  required
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g. Solar Inverter Repair or Spoken English"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Education">Education</option>
                    <option value="Creative">Creative</option>
                    <option value="Culinary">Culinary</option>
                    <option value="Home & Garden">Home & Garden</option>
                    <option value="Trades & Maintenance">Trades & Maintenance</option>
                    <option value="Health">Health</option>
                    <option value="Caregiving">Caregiving</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#6C3FC5]"
                  >
                    <option value="NEWLY_ACQUIRED">Newly Acquired (Completed)</option>
                    <option value="CURRENTLY_LEARNING">Currently Learning</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Training Institution / Method</label>
                <input
                  type="text"
                  value={learningInstitution}
                  onChange={(e) => setLearningInstitution(e.target.value)}
                  placeholder="e.g. University of Jaffna Open Course or Practical Apprenticeship"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description &amp; Project Summary</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What have you built, practiced, or learned?"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Upload Certificate / Proof Image</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleCertificateUpload}
                  className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#F2ECFF] file:text-[#6C3FC5] cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {loading ? 'Saving...' : 'Add to My Journey'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
