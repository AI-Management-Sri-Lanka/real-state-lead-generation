import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/api/authApi';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Profile Form State
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name ?? '',
    email: user?.email ?? '',
  });

  // Password Form State
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
  });

  // Delete State
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await authApi.updateProfile({
        full_name: profileForm.full_name,
        email: profileForm.email,
      });
      // A full app refresh to reload user context with new name
      toast.success('Profile updated successfully!');
      window.location.reload();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to update profile', { id: 'profile-err' });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (passwordForm.new_password.length < 8) {
      return toast.error('New password must be at least 8 characters');
    }
    setPasswordLoading(true);
    try {
      await authApi.changePassword(passwordForm);
      // After changing password, backend may revoke tokens. Sign the user out
      // and require re-login to ensure a clean session.
      toast.success('Password changed — please sign in again.');
      setPasswordForm({ current_password: '', new_password: '' });
      signOut();
      navigate('/auth/signin');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to change password', { id: 'password-err' });
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (!window.confirm('Are you absolutely sure? This action cannot be undone and will delete all your data.')) {
      return;
    }
    setDeleteLoading(true);
    try {
      await authApi.deleteAccount();
      toast.success('Account deleted.');
      signOut();
      navigate('/auth/signin');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to delete account', { id: 'delete-err' });
      setDeleteLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_30%),linear-gradient(135deg,_#f8fbff_0%,_#f3f7ff_48%,_#eef2ff_100%)] p-8 text-slate-100 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)]">
        <div className="relative">
          <div className="mx-auto max-w-2xl space-y-12">
            <header className="mb-6 flex justify-center">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
            </header>

            {/* Profile Section */}
            <section className="rounded-[24px] border border-sky-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.95),rgba(238,242,255,0.95))] p-6 shadow-[0_16px_35px_rgba(15,23,42,0.08)] dark:border-sky-800/40 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] dark:shadow-[0_16px_35px_rgba(2,6,23,0.35)]">
              <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Profile Information</h2>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  name="full_name"
                  value={profileForm.full_name}
                  disabled
                  readOnly
                />
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  disabled
                  readOnly
                />
              </form>
            </section>

            {/* Password Section */}
            <section className="rounded-[24px] border border-sky-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.95),rgba(238,242,255,0.95))] p-6 shadow-[0_16px_35px_rgba(15,23,42,0.08)] dark:border-sky-800/40 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] dark:shadow-[0_16px_35px_rgba(2,6,23,0.35)]">
              <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Change Password</h2>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input
                  label="Current Password"
                  name="current_password"
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  required
                />
                <Input
                  label="New Password"
                  name="new_password"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  required
                />
                <div className="pt-2">
                  <Button type="submit" loading={passwordLoading}>Update Password</Button>
                </div>
              </form>
            </section>

            {/* Danger Zone */}
            <section className="rounded-[24px] border border-rose-200/80 bg-[linear-gradient(135deg,rgba(255,241,242,0.95),rgba(254,242,242,0.9))] p-6 shadow-[0_12px_28px_rgba(190,24,93,0.08)] dark:border-rose-900/40 dark:bg-[linear-gradient(135deg,rgba(127,29,29,0.25),rgba(69,10,10,0.25))] dark:shadow-[0_12px_28px_rgba(127,29,29,0.16)]">
              <h2 className="mb-2 text-xl font-semibold text-rose-600 dark:text-rose-400">Danger Zone</h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                Permanently delete your account and all of your data. This action cannot be reversed.
              </p>
              <Button
                type="button"
                onClick={handleDeleteAccount}
                loading={deleteLoading}
                style={{ backgroundColor: '#7f1d1d', color: '#fca5a5' }}
              >
                Delete Account
              </Button>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
