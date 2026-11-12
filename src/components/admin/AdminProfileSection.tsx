import React, { useState, useRef } from 'react';
import {
  Camera, Upload, Trash2, CheckCircle2, AlertCircle, Shield, User,
  Key, Mail, MapPin, Sparkles, RefreshCw, X, FileImage, Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';

interface AdminProfileSectionProps {
  onOpenChangePassword?: () => void;
}

export const AdminProfileSection: React.FC<AdminProfileSectionProps> = ({ onOpenChangePassword }) => {
  const { user, refreshProfile, setShowChangePasswordModal } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string; type: string } | null>(null);

  // Operation states
  const [uploading, setUploading] = useState<boolean>(false);
  const [removing, setRemoving] = useState<boolean>(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const currentPhoto = user?.profilePhotoUrl || null;
  const adminName = user?.fullName || 'Kashika Murugathas';
  const adminEmail = user?.email || 'kashikamurugathas@gmail.com';

  // Allowed file extensions and MIME types
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

  // Trigger file selection dialog
  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Handle file chosen by admin
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      setFeedback({
        type: 'error',
        message: `Invalid image format (${ext || file.type}). Please select a JPG, JPEG, PNG, or WEBP image file.`
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setFeedback({
        type: 'error',
        message: `Image file is too large (${sizeMb} MB). The maximum allowed file size is 5.0 MB.`
      });
      return;
    }

    // Read file as base64 Data URL for live circular preview
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      setSelectedFile(file);
      setFileDetails({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type || ext.replace('.', '').toUpperCase()
      });
      setFeedback(null);
    };
    reader.onerror = () => {
      setFeedback({
        type: 'error',
        message: 'Could not read image file from your device. Please try again.'
      });
    };
    reader.readAsDataURL(file);
  };

  // Discard pending preview
  const handleCancelPreview = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setFileDetails(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save previewed photo to server & database
  const handleSavePhoto = async () => {
    if (!previewUrl) return;

    setUploading(true);
    setFeedback(null);

    try {
      const mime = selectedFile?.type || 'image/jpeg';
      const res = await api.uploadProfilePhoto(previewUrl, mime);

      // Refresh authentication profile so all navigation bars & dashboards sync
      await refreshProfile();

      setFeedback({
        type: 'success',
        message: res.message || 'Admin profile photo successfully updated and saved!'
      });

      // Clear preview
      handleCancelPreview();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update profile photo. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  // Remove existing photo and restore default avatar
  const handleConfirmRemove = async () => {
    setRemoving(true);
    setFeedback(null);
    setShowRemoveConfirm(false);

    try {
      const res = await api.removeProfilePhoto();
      await refreshProfile();
      handleCancelPreview();
      setFeedback({
        type: 'success',
        message: res.message || 'Profile photo removed. Default administrator avatar is now active.'
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to remove profile photo. Please try again.'
      });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between shadow-sm transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Profile Management Card */}
      <div className="bg-white rounded-3xl border border-[#EAE7F6] p-6 sm:p-8 shadow-sm space-y-8">
        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2ECFF] text-[#6C3FC5] text-xs font-bold mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Super Administrator Profile</span>
            </div>
            <h3 className="font-display font-extrabold text-2xl text-[#452080]">Profile Photo Management</h3>
            <p className="text-xs text-gray-500 mt-1">
              Upload, preview, update, or remove your official administrative portrait.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Verified Super Admin</span>
            </span>
          </div>
        </div>

        {/* Photo Display and Preview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Avatar Visual Area */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#FAF8FF] to-[#F2ECFF]/40 rounded-3xl border border-[#EAE7F6] space-y-4">
            <div className="relative group">
              {/* If preview exists, display the preview circular avatar */}
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="New profile preview"
                    className="w-40 h-40 rounded-full object-cover ring-4 ring-amber-400 shadow-xl transition-all"
                  />
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className="px-3 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm">
                      Unsaved Preview
                    </span>
                  </div>
                </div>
              ) : currentPhoto ? (
                /* Saved photo display in circular format */
                <div className="relative">
                  <img
                    src={currentPhoto}
                    alt={adminName}
                    onError={(e) => {
                      // Fallback to default avatar if image fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                    className="w-40 h-40 rounded-full object-cover ring-4 ring-[#6C3FC5]/30 shadow-xl"
                  />
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className="px-3 py-0.5 rounded-full bg-[#6C3FC5] text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm">
                      Active Photo
                    </span>
                  </div>
                </div>
              ) : (
                /* Default Profile Avatar when no photo is uploaded */
                <div className="relative">
                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#6C3FC5] to-[#452080] flex flex-col items-center justify-center text-white ring-4 ring-[#6C3FC5]/20 shadow-xl">
                    <User className="w-16 h-16 text-white/90 mb-1" />
                    <span className="font-display font-extrabold text-sm tracking-wider text-purple-200">
                      KM
                    </span>
                  </div>
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className="px-3 py-0.5 rounded-full bg-gray-600 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm">
                      Default Avatar
                    </span>
                  </div>
                </div>
              )}

              {/* Floating Camera Icon overlay to trigger file upload */}
              <button
                type="button"
                onClick={handleTriggerFileInput}
                className="absolute bottom-1 right-1 p-2.5 rounded-full bg-[#6C3FC5] text-white shadow-lg hover:bg-[#5A32AA] hover:scale-110 active:scale-95 transition-all border-2 border-white cursor-pointer"
                title="Choose new photo from device"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="text-center pt-2">
              <h4 className="font-display font-bold text-base text-gray-900">{adminName}</h4>
              <p className="text-xs text-gray-500">{adminEmail}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F2ECFF] text-[#6C3FC5] text-[11px] font-bold">
                <Shield className="w-3 h-3" />
                <span>Super Administrator</span>
              </div>
            </div>
          </div>

          {/* Controls & Status Area */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h4 className="font-display font-bold text-lg text-gray-900">Manage Your Picture</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Your profile picture is displayed across the Administrator Dashboard, platform audit logs,
                approval notifications sent to members, and header navigation.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* 1. Change Profile Photo Button */}
              <button
                type="button"
                onClick={handleTriggerFileInput}
                disabled={uploading}
                className="px-5 py-2.5 rounded-xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#6C3FC5]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{previewUrl ? 'Choose Different Photo' : 'Change Profile Photo'}</span>
              </button>

              {/* 2. Save Photo Button (Shown when preview is active) */}
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Photo...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Photo</span>
                    </>
                  )}
                </button>
              )}

              {/* 3. Cancel Preview Button (Shown when preview is active) */}
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleCancelPreview}
                  disabled={uploading}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel Preview</span>
                </button>
              )}

              {/* 4. Remove Photo Button (Shown when saved photo exists and not previewing) */}
              {currentPhoto && !previewUrl && (
                <button
                  type="button"
                  onClick={() => setShowRemoveConfirm(true)}
                  disabled={removing}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {removing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
                      <span>Removing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Remove Photo</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Preview Information Box */}
            {previewUrl && fileDetails && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <FileImage className="w-4 h-4 text-amber-600" />
                  <span>Selected Image Ready to Save:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-amber-800">
                  <div>File: <strong className="font-semibold truncate block">{fileDetails.name}</strong></div>
                  <div>Size: <strong>{fileDetails.size}</strong></div>
                  <div>Format: <strong>{fileDetails.type}</strong></div>
                </div>
                <p className="text-[11px] text-amber-700 pt-1">
                  Click the <strong>&ldquo;Save Photo&rdquo;</strong> button above to apply this new picture to your Admin account.
                </p>
              </div>
            )}

            {/* Photo Guidelines Card */}
            <div className="p-4 rounded-2xl bg-[#FAF8FF] border border-[#EAE7F6] text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#452080] font-bold">
                <Info className="w-4 h-4 text-[#6C3FC5]" />
                <span>Upload Guidelines &amp; Requirements</span>
              </div>
              <ul className="text-gray-600 text-[11px] space-y-1 list-disc list-inside">
                <li>Supported formats: <strong>JPG, JPEG, PNG, WEBP</strong></li>
                <li>Maximum file size: <strong>5.0 MB</strong></li>
                <li>Recommended aspect ratio: <strong>1:1 Square</strong> (auto-cropped to circle)</li>
                <li>High quality portrait recommended with centered face positioning</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Removing Photo */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-display font-bold text-lg text-gray-900">Remove Profile Photo?</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to delete your administrator profile photo? Your account will revert to the default administrator avatar.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowRemoveConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
              >
                Keep Photo
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={removing}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-2"
              >
                {removing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Yes, Remove Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Identity & Security Details Card */}
      <div className="bg-white rounded-3xl border border-[#EAE7F6] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h4 className="font-display font-bold text-lg text-[#452080]">Administrator Account Credentials</h4>
            <p className="text-xs text-gray-500">Security and contact details tied to this profile</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onOpenChangePassword) onOpenChangePassword();
              else setShowChangePasswordModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#F2ECFF] hover:bg-[#E9DEFF] text-[#6C3FC5] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Change Password</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Full Name</span>
            <span className="font-semibold text-xs text-gray-800">{adminName}</span>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Email Address</span>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-semibold text-xs text-gray-800 truncate">{adminEmail}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Role Authorization</span>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#6C3FC5]" />
              <span className="font-semibold text-xs text-[#6C3FC5]">SUPER_ADMIN</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Account ID</span>
            <span className="font-mono text-xs text-gray-700">{user?.id || 'USR_SUPER_ADMIN_001'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Administrative Location</span>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-semibold text-xs text-gray-800">Nallur, Jaffna (Sri Lanka)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Governance Status</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-xs text-emerald-700">Active &amp; Fully Privileged</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
