/**
 * Profile Page - CommunityPulse
 * User profile management with settings and account controls
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { useFeedback } from '../hooks/useFeedback';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input, Textarea } from '../components/ui/Input';
import { 
  User, Mail, Lock, Eye, EyeOff, Shield, Calendar, 
  MessageSquare, CheckCircle, AlertCircle, Loader2,
  LogOut, Trash2, Bell, Save, X, Edit2
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { PASSWORD_RULES } from '../lib/constants';

// Email validation schema
const emailSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .optional()
    .or(z.literal(''))
});

// Password change validation schema
const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  confirm_password: z.string()
}).refine(data => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password']
});

export function Profile() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [notifications, setNotifications] = useState(true);

  const { user, loading: authLoading, updateProfile, changePassword, logout } = useAuth();
  const {  feedback } = useFeedback({ include_mine: 'true' });
  const navigate = useNavigate();

  // Calculate user stats
  const stats = {
    feedbackCount: feedback?.length || 0,
    memberSince: user?.created_at,
    daysMember: user?.created_at 
      ? Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))
      : 0
  };

  // Email form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors, isSubmitting: emailSubmitting },
    reset: resetEmail
  } = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: user?.email || '' }
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
    reset: resetPassword,
    watch: watchPassword
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: ''
    }
  });

  const getPasswordStrength = () => {
    const password = watchPassword('new_password');
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'red' };
    if (score <= 4) return { score, label: 'Medium', color: 'yellow' };
    return { score, label: 'Strong', color: 'green' };
  };

  const passwordStrength = getPasswordStrength();

  // Handle email update
  const onEmailSubmit = async (data) => {
    setProfileError('');
    setProfileSuccess('');
    
    try {
      const result = await updateProfile({ email: data.email || null });
      if (result.success) {
        setProfileSuccess('Email updated successfully');
        setEditEmail(false);
        setTimeout(() => setProfileSuccess(''), 3000);
      } else {
        setProfileError(result.error || 'Failed to update email');
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to update email');
    }
  };

  // Handle password change
  const onPasswordSubmit = async (data) => {
    setProfileError('');
    setProfileSuccess('');
    
    try {
      const result = await changePassword({
        current_password: data.current_password,
        new_password: data.new_password
      });
      if (result.success) {
        setProfileSuccess('Password changed successfully');
        setEditPassword(false);
        resetPassword();
        setTimeout(() => setProfileSuccess(''), 3000);
      } else {
        setProfileError(result.error || 'Failed to change password');
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to change password');
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user?.username) {
      setProfileError('Username does not match');
      return;
    }

    try {
      // TODO: Implement delete account API
      // await deleteAccount();
      logout();
      navigate('/login', { 
        state: { message: 'Account deleted successfully' } 
      });
    } catch (err) {
      setProfileError(err.message || 'Failed to delete account');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* ===== PAGE HEADER ===== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your account settings and preferences
          </p>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* ===== SUCCESS/ERROR ALERTS ===== */}
      {profileSuccess && (
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-800 dark:text-green-300">{profileSuccess}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {profileError && (
        <Card className="border-l-4 border-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-800 dark:text-red-300">{profileError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== PROFILE OVERVIEW CARD ===== */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.username}
              </h2>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <Shield className="w-4 h-4 text-primary-600" />
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  user?.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {user?.role || 'member'}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {user?.email || 'No email provided'}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <MessageSquare className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.feedbackCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Feedback</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Calendar className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.daysMember}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Days</p>
              </div>
            </div>
          </div>

          {/* Member Since */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Member since {stats.memberSince ? formatDate(stats.memberSince, { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ===== EMAIL SETTINGS ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Email Settings
              </h3>
            </div>
            {!editEmail && (
              <Button variant="ghost" size="sm" onClick={() => setEditEmail(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editEmail ? (
            <form onSubmit={handleSubmitEmail(onEmailSubmit)} className="space-y-4">
              <Input
                {...registerEmail('email')}
                type="email"
                label="Email Address"
                placeholder="your@email.com"
                error={emailErrors.email?.message}
                disabled={emailSubmitting}
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" loading={emailSubmitting}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => { setEditEmail(false); resetEmail(); }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <Mail className="w-5 h-5" />
              <span>{user?.email || 'Not provided'}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== PASSWORD SETTINGS ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Change Password
              </h3>
            </div>
            {!editPassword && (
              <Button variant="ghost" size="sm" onClick={() => setEditPassword(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editPassword ? (
            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
              
              {/* Current Password */}
              <div className="relative">
                <Input
                  {...registerPassword('current_password')}
                  type={showCurrentPassword ? 'text' : 'password'}
                  label="Current Password"
                  error={passwordErrors.current_password?.message}
                  disabled={passwordSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* New Password */}
              <div className="relative">
                <Input
                  {...registerPassword('new_password')}
                  type={showNewPassword ? 'text' : 'password'}
                  label="New Password"
                  error={passwordErrors.new_password?.message}
                  disabled={passwordSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength */}
              {watchPassword('new_password') && (
                <div className="space-y-2">
                  <div className="flex space-x-1">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded ${
                          index < passwordStrength.score
                            ? `bg-${passwordStrength.color}-500`
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    passwordStrength.color === 'red' ? 'text-red-500' :
                    passwordStrength.color === 'yellow' ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    Password strength: <span className="font-medium">{passwordStrength.label}</span>
                  </p>
                </div>
              )}

              {/* Password Requirements */}
              <div className="grid grid-cols-2 gap-2">
                {PASSWORD_RULES.map((rule, index) => {
                  const met = watchPassword('new_password') && rule.regex.test(watchPassword('new_password'));
                  return (
                    <div key={index} className="flex items-center text-xs">
                      {met ? (
                        <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                      ) : (
                        <X className="w-3 h-3 text-gray-400 mr-1" />
                      )}
                      <span className={met ? 'text-green-600' : 'text-gray-500'}>
                        {rule.message}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Input
                  {...registerPassword('confirm_password')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Confirm New Password"
                  error={passwordErrors.confirm_password?.message}
                  disabled={passwordSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-2">
                <Button type="submit" size="sm" loading={passwordSubmitting}>
                  <Save className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => { setEditPassword(false); resetPassword(); }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <Lock className="w-5 h-5" />
              <span>••••••••••••</span>
              <span className="text-sm text-gray-500">(Last changed recently)</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== NOTIFICATION PREFERENCES ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notification Preferences
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive updates about your feedback submissions
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* ===== DANGER ZONE ===== */}
      <Card className="border-2 border-red-200 dark:border-red-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
          </div>
        </CardHeader>
        <CardContent>
          {!showDeleteConfirm ? (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Once you delete your account, there is no going back. All your feedback and data will be permanently removed.
              </p>
              <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-2">
                  Type your username to confirm deletion:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                  placeholder={user?.username}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="danger" 
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== user?.username}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Delete
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== SECURITY NOTICE ===== */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
        <p>All data is encrypted and transmitted securely over HTTPS</p>
        <p>Password is hashed with bcrypt (12 rounds)</p>
      </div>
    </div>
  );
}