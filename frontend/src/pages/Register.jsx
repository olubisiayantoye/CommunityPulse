/**
 * Register Page - CommunityPulse
 * User registration with validation and password strength indicator
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { UserPlus, Mail, Lock, Eye, EyeOff, User, Check, X, AlertCircle } from 'lucide-react';
import { PASSWORD_RULES } from '../lib/constants';
import { debounce } from '../lib/utils';

// Form validation schema
const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms')
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

export function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    trigger,
    setValue
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false
    }
  });

  const password = watch('password');
  const username = watch('username');

  // Calculate password strength
  const getPasswordStrength = () => {
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

  // Check username availability (debounced)
  const checkUsernameAvailability = async (value) => {
    if (!value || value.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const { checkUsername } = useAuth();
      const result = await checkUsername(value);
      setUsernameAvailable(!result.taken);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const debouncedCheckUsername = debounce(checkUsernameAvailability, 500);

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setValue('username', value);
    debouncedCheckUsername(value);
  };

  const onSubmit = async (data) => {
    setRegisterError('');
    
    // Final username check before submission
    if (usernameAvailable === false) {
      setRegisterError('Username is already taken. Please choose another.');
      return;
    }

    try {
      const { terms, confirmPassword, ...registerData } = data;
      const result = await registerUser(registerData);
      
      if (result.success) {
        navigate('/login', { 
          state: { message: 'Registration successful! Please log in.' } 
        });
      } else {
        setRegisterError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setRegisterError(err.message || 'An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full shadow-xl animate-slide-up">
        <CardContent className="p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-primary-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Join CommunityPulse today</p>
          </div>

          {/* Error Alert */}
          {registerError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-800 dark:text-red-300 font-medium">Registration Failed</p>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">{registerError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('username')}
                  type="text"
                  onChange={handleUsernameChange}
                  className={`
                    w-full pl-10 pr-10 py-3 border rounded-lg
                    focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                    dark:bg-gray-800 dark:text-white dark:border-gray-600
                    placeholder:text-gray-400
                    ${errors.username ? 'border-red-500' : 'border-gray-300'}
                    ${usernameAvailable === true ? 'border-green-500' : ''}
                    ${usernameAvailable === false ? 'border-red-500' : ''}
                  `}
                  placeholder="Choose a username"
                  disabled={isSubmitting || loading || checkingUsername}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {checkingUsername && (
                    <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full" />
                  )}
                  {usernameAvailable === true && !checkingUsername && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                  {usernameAvailable === false && !checkingUsername && (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
              )}
              {usernameAvailable === true && (
                <p className="mt-1 text-sm text-green-500">Username is available</p>
              )}
              {usernameAvailable === false && (
                <p className="mt-1 text-sm text-red-500">Username is already taken</p>
              )}
            </div>

            {/* Email Field (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email <span className="text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className={`
                    w-full pl-10 pr-4 py-3 border rounded-lg
                    focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                    dark:bg-gray-800 dark:text-white dark:border-gray-600
                    placeholder:text-gray-400
                    ${errors.email ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="your@email.com"
                  disabled={isSubmitting || loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`
                    w-full pl-10 pr-12 py-3 border rounded-lg
                    focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                    dark:bg-gray-800 dark:text-white dark:border-gray-600
                    placeholder:text-gray-400
                    ${errors.password ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="Create a strong password"
                  disabled={isSubmitting || loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-2">
                  <div className="flex space-x-1">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded transition-colors ${
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
              <div className="mt-3 space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Password must contain:</p>
                <div className="grid grid-cols-2 gap-1">
                  {PASSWORD_RULES.map((rule, index) => {
                    const met = password && rule.regex.test(password);
                    return (
                      <div key={index} className="flex items-center text-xs">
                        {met ? (
                          <Check className="w-3 h-3 text-green-500 mr-1" />
                        ) : (
                          <X className="w-3 h-3 text-gray-400 mr-1" />
                        )}
                        <span className={met ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                          {rule.message}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`
                    w-full pl-10 pr-12 py-3 border rounded-lg
                    focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                    dark:bg-gray-800 dark:text-white dark:border-gray-600
                    placeholder:text-gray-400
                    ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="Confirm your password"
                  disabled={isSubmitting || loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
              {watch('confirmPassword') && password === watch('confirmPassword') && (
                <p className="mt-1 text-sm text-green-500">Passwords match</p>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start">
              <input
                {...register('terms')}
                type="checkbox"
                id="terms"
                className="w-4 h-4 mt-1 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                disabled={isSubmitting || loading}
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:underline dark:text-primary-400" target="_blank">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-600 hover:underline dark:text-primary-400" target="_blank">
                  Privacy Policy
                </Link>
                <span className="text-red-500"> *</span>
              </label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-500 -mt-3">{errors.terms.message}</p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isSubmitting || loading}
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center mt-8 text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium hover:underline"
            >
              Sign in here
            </Link>
          </p>

          {/* Security Notice */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <Lock className="w-4 h-4" />
              <span>Your password is encrypted with bcrypt (12 rounds)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}