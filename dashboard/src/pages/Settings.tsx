import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { changePassword, deleteAccount, updateSessionDuration } from '../lib/api';
import { User, Mail, Shield, Trash2, Loader2, Check, AlertCircle, X, Clock } from 'lucide-react';

const SESSION_OPTIONS = [
  { value: 3600, label: '1 hour' },
  { value: 86400, label: '24 hours' },
  { value: 604800, label: '7 days' },
  { value: 2592000, label: '30 days' },
];

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Session duration state
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState(false);
  const [sessionError, setSessionError] = useState('');

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const isOAuthUser = !!user?.oauth_provider;

  const handleSessionDurationChange = async (seconds: number) => {
    setSessionError('');
    setSessionSuccess(false);
    setSessionLoading(true);

    const res = await updateSessionDuration(seconds);
    setSessionLoading(false);

    if (res.success) {
      setSessionSuccess(true);
      await refreshUser();
      setTimeout(() => setSessionSuccess(false), 2000);
    } else {
      setSessionError(res.error?.message || 'Failed to update session duration');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setPasswordLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setPasswordLoading(false);

    if (res.success) {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    } else {
      setPasswordError(res.error?.message || 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleteLoading(true);

    const res = await deleteAccount(
      isOAuthUser ? undefined : deletePassword,
      isOAuthUser ? true : undefined
    );

    setDeleteLoading(false);

    if (res.success) {
      logout();
    } else {
      setDeleteError(res.error?.message || 'Failed to delete account');
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-n2f-text">Settings</h1>
        <p className="text-n2f-text-secondary mt-1">Manage your account settings</p>
      </div>

      {/* Profile Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-n2f-accent/10 rounded-lg">
            <User className="h-5 w-5 text-n2f-accent" />
          </div>
          <h2 className="text-lg font-semibold text-n2f-text">Profile</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Email</label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-n2f-text-muted" />
              <span className="text-n2f-text">{user?.email}</span>
            </div>
          </div>

          <div>
            <label className="label">Account Status</label>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 capitalize">
              {user?.status}
            </span>
          </div>

          <div>
            <label className="label">Current Plan</label>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-n2f-accent/10 text-n2f-accent capitalize">
              {user?.plan}
            </span>
          </div>

          {isOAuthUser && (
            <div>
              <label className="label">Login Method</label>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/30 text-purple-400 capitalize">
                {user?.oauth_provider}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Security Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-900/30 rounded-lg">
            <Shield className="h-5 w-5 text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold text-n2f-text">Security</h2>
        </div>

        <div className="space-y-4">
          {!isOAuthUser && (
            <div>
              <label className="label">Password</label>
              <p className="text-sm text-n2f-text-secondary mb-2">
                Change your password to keep your account secure
              </p>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="btn-secondary"
              >
                Change Password
              </button>
            </div>
          )}

          {isOAuthUser && (
            <div>
              <label className="label">Password</label>
              <p className="text-sm text-n2f-text-secondary">
                You signed in with {user?.oauth_provider}. Password management is handled by your OAuth provider.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-n2f-border">
            <label className="label flex items-center gap-2">
              <Clock className="h-4 w-4 text-n2f-text-muted" />
              Session Duration
            </label>
            <p className="text-sm text-n2f-text-secondary mb-2">
              How long you stay logged in before needing to sign in again
            </p>

            {sessionError && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-sm mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {sessionError}
              </div>
            )}

            {sessionSuccess && (
              <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-400 px-3 py-2 rounded-lg text-sm mb-2 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Session duration updated
              </div>
            )}

            <div className="flex items-center gap-2">
              <select
                className="input w-48"
                value={user?.session_duration_seconds || 86400}
                onChange={(e) => handleSessionDurationChange(Number(e.target.value))}
                disabled={sessionLoading}
              >
                {SESSION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {sessionLoading && <Loader2 className="h-4 w-4 animate-spin text-n2f-text-muted" />}
            </div>
          </div>

          <div className="pt-4 border-t border-n2f-border">
            <label className="label">Active Sessions</label>
            <p className="text-sm text-n2f-text-secondary mb-2">
              Sign out of all other sessions
            </p>
            <button onClick={logout} className="btn-secondary">
              Sign Out Everywhere
            </button>
          </div>
        </div>
      </div>

      {/* MCP Configuration Help */}
      <div className="card">
        <h2 className="text-lg font-semibold text-n2f-text mb-4">
          MCP Client Configuration
        </h2>
        <p className="text-sm text-n2f-text-secondary mb-4">
          Use this configuration in your MCP client (Claude Desktop, Cursor, etc.)
        </p>

        <div className="bg-black rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-green-400">
{`{
  "mcpServers": {
    "n8n": {
      "url": "${import.meta.env.VITE_API_URL || 'https://your-api.workers.dev'}/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}`}
          </pre>
        </div>

        <p className="text-xs text-n2f-text-secondary mt-3">
          Replace YOUR_API_KEY with the API key from your connection.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-900/30 rounded-lg">
            <Trash2 className="h-5 w-5 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-red-300">Danger Zone</h2>
        </div>

        <p className="text-sm text-n2f-text-secondary mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-danger"
          >
            Delete Account
          </button>
        ) : (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
            <p className="text-sm text-red-300 mb-4">
              Are you sure you want to delete your account? This action cannot be
              undone. All your data, connections, and API keys will be permanently
              deleted.
            </p>

            {deleteError && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-sm mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {deleteError}
              </div>
            )}

            {!isOAuthUser && (
              <div className="mb-4">
                <label className="label text-red-300">Enter your password to confirm</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || (!isOAuthUser && !deletePassword)}
                className="btn-danger"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete My Account'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-n2f-elevated rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-n2f-border">
              <h2 className="text-lg font-semibold text-n2f-text">
                Change Password
              </h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError('');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="p-1 text-n2f-text-muted hover:text-n2f-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="p-6 text-center">
                <div className="bg-emerald-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-medium text-n2f-text">Password Updated!</h3>
                <p className="text-n2f-text-secondary mt-1">Your password has been changed successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="p-4 space-y-4">
                {passwordError && (
                  <div className="bg-red-900/30 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {passwordError}
                  </div>
                )}

                <div>
                  <label className="label">Current Password</label>
                  <input
                    type="password"
                    className="input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    className="input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-n2f-text-secondary mt-1">
                    Must be at least 8 characters
                  </p>
                </div>

                <div>
                  <label className="label">Confirm New Password</label>
                  <input
                    type="password"
                    className="input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordError('');
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="btn-primary flex-1"
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
