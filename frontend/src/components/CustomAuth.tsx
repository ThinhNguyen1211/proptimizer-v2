import { useState } from 'react';
import { signIn, signUp, confirmSignUp } from 'aws-amplify/auth';
import type { SignUpInput } from 'aws-amplify/auth';
import { Mail, Lock, Eye, EyeOff, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

type AuthView = 'SIGN_IN' | 'SIGN_UP' | 'CONFIRM_SIGN_UP';

export default function CustomAuth() {
  const [view, setView] = useState<AuthView>('SIGN_IN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { isSignedIn } = await signIn({
        username: email,
        password,
      });

      if (isSignedIn) {
        setSuccess('Sign in successful! Redirecting...');
        // Hub listener in App.tsx will handle navigation
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      // Format error messages
      if (err.name === 'NotAuthorizedException') {
        setError('Incorrect email or password');
      } else if (err.name === 'UserNotConfirmedException') {
        setError('Please verify your email first');
        setView('CONFIRM_SIGN_UP');
      } else if (err.name === 'UserNotFoundException') {
        setError('No account found with this email');
      } else {
        setError(err.message || 'Sign in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const signUpParams: SignUpInput = {
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
          autoSignIn: true,
        },
      };

      const { isSignUpComplete, nextStep } = await signUp(signUpParams);

      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setSuccess('Account created! Check your email for verification code.');
        setView('CONFIRM_SIGN_UP');
      } else if (isSignUpComplete) {
        setSuccess('Account created successfully! Please sign in.');
        setView('SIGN_IN');
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      
      // Format error messages
      if (err.name === 'UsernameExistsException') {
        setError('An account with this email already exists');
      } else if (err.name === 'InvalidPasswordException') {
        setError('Password must contain uppercase, lowercase, and numbers');
      } else if (err.name === 'InvalidParameterException') {
        setError('Invalid email format');
      } else {
        setError(err.message || 'Sign up failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Confirm Sign Up
  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      if (isSignUpComplete) {
        setSuccess('Email verified! Signing you in...');
        
        // Auto sign-in after confirmation
        setTimeout(async () => {
          try {
            await signIn({ username: email, password });
          } catch {
            setView('SIGN_IN');
            setSuccess('Email verified! Please sign in.');
          }
        }, 1000);
      }
    } catch (err: any) {
      console.error('Confirmation error:', err);
      
      // Format error messages
      if (err.name === 'CodeMismatchException') {
        setError('Invalid verification code');
      } else if (err.name === 'ExpiredCodeException') {
        setError('Verification code expired. Please request a new one.');
      } else {
        setError(err.message || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Tabs */}
        {view !== 'CONFIRM_SIGN_UP' && (
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setView('SIGN_IN');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-4 px-6 font-semibold transition-all ${
                view === 'SIGN_IN'
                  ? 'text-[#00bcd4] border-b-2 border-[#00bcd4] bg-cyan-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setView('SIGN_UP');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-4 px-6 font-semibold transition-all ${
                view === 'SIGN_UP'
                  ? 'text-[#00bcd4] border-b-2 border-[#00bcd4] bg-cyan-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Form Container */}
        <div className="p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-3 animate-fadeIn">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">{error}</p>
              </div>
            </div>
          )}

          {/* Sign In Form */}
          {view === 'SIGN_IN' && (
            <form onSubmit={handleSignIn} className="space-y-5">
              <div>
                <label htmlFor="signin-email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all outline-none text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signin-password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all outline-none text-gray-900 placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#00bcd4] to-[#6366f1] hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          )}

          {/* Sign Up Form */}
          {view === 'SIGN_UP' && (
            <form onSubmit={handleSignUp} className="space-y-5">
              <div>
                <label htmlFor="signup-email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all outline-none text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all outline-none text-gray-900 placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Must be at least 8 characters with uppercase, lowercase, and numbers
                </p>
              </div>

              <div>
                <label htmlFor="signup-confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all outline-none text-gray-900 placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#00bcd4] to-[#6366f1] hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>
          )}

          {/* Confirm Sign Up Form */}
          {view === 'CONFIRM_SIGN_UP' && (
            <form onSubmit={handleConfirmSignUp} className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-[#00bcd4]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Check Your Email
                </h3>
                <p className="text-sm text-gray-600">
                  We sent a verification code to <strong>{email}</strong>
                </p>
              </div>

              <div>
                <label htmlFor="confirm-code" className="block text-sm font-semibold text-gray-700 mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="confirm-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    placeholder="123456"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all outline-none text-gray-900 placeholder-gray-400 text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#00bcd4] to-[#6366f1] hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify Email</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setView('SIGN_IN')}
                className="w-full text-sm text-gray-600 hover:text-[#00bcd4] font-medium transition-colors"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
