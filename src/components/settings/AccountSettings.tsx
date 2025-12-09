'use client';

import { useState, useRef } from 'react';
import {
  User,
  Mail,
  Camera,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Trash2,
  Key,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { triggerLibraryRefresh } from '@/lib/events/libraryEvents';

interface AccountSettingsProps {
  profile: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  userEmail: string;
}

export default function AccountSettings({ profile, userEmail }: AccountSettingsProps) {
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || userEmail);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Check if there are unsaved changes
  const hasChanges = fullName !== (profile?.full_name || '') || email !== userEmail;

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setSaving(false);
      return;
    }

    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        setSaving(false);
        return;
      }

      // Update profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          email: email,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        setError(profileError.message);
        setSaving(false);
        return;
      }

      // If email changed, update auth email too
      if (email !== userEmail) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email,
        });

        if (emailError) {
          setError(emailError.message);
          setSaving(false);
          return;
        }

        setSuccess('Profile updated! Check your new email for a confirmation link.');
      } else {
        setSuccess('Profile updated successfully');
      }

      // Trigger sidebar refresh to show updated name
      triggerLibraryRefresh();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('An unexpected error occurred');
    }

    setSaving(false);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    // Validate inputs
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setChangingPassword(true);

    try {
      const supabase = createClient();

      // First, verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        setPasswordError('Current password is incorrect');
        setChangingPassword(false);
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setPasswordError(updateError.message);
        setChangingPassword(false);
        return;
      }

      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Close modal after success
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordError('An unexpected error occurred');
    }

    setChangingPassword(false);
  };

  const resetPasswordModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Section Header */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-2">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
              <User className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="absolute -inset-1 bg-cyan-500/20 rounded-xl blur-lg -z-10 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wide">Account Settings</h2>
            <p className="text-gray-400 text-sm">Manage your personal information and preferences</p>
          </div>
        </div>
        {/* Decorative scanline */}
        <div className="absolute -bottom-4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 animate-fade-in">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-400">{success}</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-purple-500/10 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-abyss/90 backdrop-blur-sm border border-steel/50 rounded-2xl overflow-hidden">
          {/* Header accent bar */}
          <div className="h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

          <div className="p-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group/avatar">
                {/* Avatar ring animation */}
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 opacity-50 blur group-hover/avatar:opacity-75 transition-opacity animate-[spin_4s_linear_infinite]" />
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-steel bg-deep">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                      <User className="w-10 h-10 text-gray-500" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-void/80 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="w-6 h-6 text-cyan-400" />
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-bold text-white mb-1">Profile Picture</h3>
                <p className="text-sm text-gray-500 mb-3">
                  JPG, PNG or GIF. Max 2MB.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-deep border border-steel/50 hover:border-cyan-500/50 hover:bg-cyan-500/10 rounded-lg text-sm font-medium text-gray-300 hover:text-cyan-400 transition-all"
                >
                  Upload New Photo
                </button>
              </div>
            </div>

            {/* Divider with circuit pattern */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-steel/50 to-transparent" />
              </div>
              <div className="relative flex justify-center">
                <div className="flex gap-1 px-4 bg-abyss">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-steel/50"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid gap-6">
              {/* Display Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <User className="w-4 h-4 text-cyan-400" />
                  Display Name
                </label>
                <div className="relative group/input">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your display name"
                    className="w-full px-4 py-3 bg-deep/50 border border-steel/30 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 group-focus-within/input:w-full transition-all duration-300" />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 pr-24 bg-deep/50 border border-steel/30 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {email === userEmail ? (
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[10px] font-bold text-emerald-400 uppercase">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[10px] font-bold text-amber-400 uppercase">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                {email !== userEmail && (
                  <p className="text-xs text-amber-400/80 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    You&apos;ll need to confirm your new email address
                  </p>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {hasChanges && (
                <span className="text-xs text-amber-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Unsaved changes
                </span>
              )}
              <button
                onClick={handleSaveProfile}
                disabled={saving || !hasChanges}
                className="relative px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 rounded-xl font-semibold text-void transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 overflow-hidden group/btn"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-cyan-500/10 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-abyss/90 backdrop-blur-sm border border-steel/50 rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                  <Key className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Password & Security</h3>
                  <p className="text-sm text-gray-500">Last changed 30 days ago</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-5 py-2.5 bg-deep border border-steel/50 hover:border-purple-500/50 hover:bg-purple-500/10 rounded-xl font-medium text-gray-300 hover:text-purple-400 transition-all flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/20 via-red-600/10 to-red-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-abyss/90 backdrop-blur-sm border border-red-500/20 rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-400">Danger Zone</h3>
                <p className="text-sm text-gray-500">Irreversible and destructive actions</p>
              </div>
            </div>

            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-white mb-1">Delete Account</h4>
                  <p className="text-sm text-gray-500">
                    Permanently delete your account and all associated data. This cannot be undone.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-5 py-2.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 rounded-xl font-medium text-red-400 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-abyss border border-red-500/30 rounded-2xl p-6 max-w-md w-full animate-modal-slide-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Confirm Deletion</h3>
                <p className="text-sm text-gray-500">This action is permanent</p>
              </div>
            </div>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete your account? All your games, progress, and data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-5 py-2.5 bg-deep border border-steel/50 hover:border-steel rounded-xl font-medium text-gray-300 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button className="flex-1 px-5 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" onClick={resetPasswordModal} />
          <div className="relative bg-abyss border border-purple-500/30 rounded-2xl p-6 max-w-md w-full animate-modal-slide-in">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <Key className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Change Password</h3>
                <p className="text-sm text-gray-500">Update your security credentials</p>
              </div>
            </div>

            {/* Error/Success Messages */}
            {passwordError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{passwordError}</p>
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-sm text-emerald-400">{passwordSuccess}</p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 bg-deep/50 border border-steel/30 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 bg-deep/50 border border-steel/30 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Minimum 6 characters</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 bg-deep/50 border border-steel/30 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetPasswordModal}
                disabled={changingPassword}
                className="flex-1 px-5 py-2.5 bg-deep border border-steel/50 hover:border-steel rounded-xl font-medium text-gray-300 hover:text-white transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
