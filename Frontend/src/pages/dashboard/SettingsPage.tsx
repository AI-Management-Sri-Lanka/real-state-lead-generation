import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/api/authApi';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

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
      toast.success('Password changed successfully!');
      setPasswordForm({ current_password: '', new_password: '' });
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
    <div className="flex-1 overflow-y-auto bg-slate-900 p-8 text-slate-100">
      <div className="mx-auto max-w-2xl space-y-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
          <p className="mt-2 text-slate-400">Manage your profile information and security preferences.</p>
        </div>

        {/* Profile Section */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Profile Information</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <Input
              label="Full Name"
              name="full_name"
              value={profileForm.full_name}
              onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              required
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              required
            />
            <div className="pt-2">
              <Button type="submit" loading={profileLoading}>Save Changes</Button>
            </div>
          </form>
        </section>

        {/* Password Section */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Change Password</h2>
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
        <section className="rounded-2xl border border-red-900/50 bg-red-950/20 p-6">
          <h2 className="mb-2 text-xl font-semibold text-red-500">Danger Zone</h2>
          <p className="mb-6 text-sm text-slate-400">
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
  );
}
