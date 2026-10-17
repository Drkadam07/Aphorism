import React, { useState, useRef, useEffect } from 'react';
import { useAuth, AuthModalView } from '../../context/AuthContext.tsx';
import { useToast } from '../ui/Toast.tsx';
import { X, KeyRound, Mail, User as UserIcon, Lock, ArrowRight, RefreshCw, Sparkles } from 'lucide-react';
import { validateOtp } from '../../lib/utils.ts';

export function AuthModal() {
  const {
    authModalOpen,
    authModalView,
    pendingEmail,
    lastDispatchedOtp,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    verifyOtp,
    resendOtp,
  } = useAuth();

  const { showToast } = useToast();

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('janedoe');
  const [loginPassword, setLoginPassword] = useState('SecurePassword123');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // OTP state: 6 boxes
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTargetEmail, setOtpTargetEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // General loading & error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (pendingEmail) {
      setOtpTargetEmail(pendingEmail);
    }
  }, [pendingEmail]);

  // Focus first OTP box when entering OTP view
  useEffect(() => {
    if (authModalOpen && authModalView === 'verify-otp') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [authModalOpen, authModalView]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!authModalOpen) return null;

  // Handle single digit input and autofocus next
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setErrorMessage(null);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 5);
    otpInputsRef.current[nextIndex]?.focus();
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await login({
        username_or_email: loginIdentifier,
        password: loginPassword,
      });
      showToast('Welcome back! Logged in successfully.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await register({
        name: regName,
        username: regUsername,
        email: regEmail,
        password: regPassword,
      });
      setOtpTargetEmail(regEmail);
      showToast(res.message, 'success');
      if (res.otp) {
        showToast(`Verification code sent. Demo OTP is: ${res.otp}`, 'info');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit OTP
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (!validateOtp(code)) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await verifyOtp({
        email: otpTargetEmail,
        otp_code: code,
      });
      showToast('Email verified successfully! You are now logged in.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired OTP code';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !otpTargetEmail) return;
    setIsSubmitting(true);
    try {
      const res = await resendOtp({ email: otpTargetEmail });
      setResendCooldown(30);
      showToast(res.message, 'success');
      if (res.otp) {
        showToast(`New code dispatched: ${res.otp}`, 'info');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not resend OTP';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fast 1-click fill helper for demo accounts
  const fillDemoAccount = (username: string) => {
    setLoginIdentifier(username);
    setLoginPassword('SecurePassword123');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 rounded-lg transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mb-3 text-xl font-serif font-bold text-neutral-900 dark:text-neutral-100">
            A
          </div>
          <h2 id="auth-modal-title" className="text-2xl font-serif font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            {authModalView === 'login' && 'Sign In to Aphorism'}
            {authModalView === 'register' && 'Create Your Account'}
            {authModalView === 'verify-otp' && 'Verify Your Email'}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {authModalView === 'login' && 'Curate timeless thoughts and join intellectual threads.'}
            {authModalView === 'register' && 'A minimalist home for quotes, aphorisms, and ideas.'}
            {authModalView === 'verify-otp' && `Enter the 6-digit code sent to ${otpTargetEmail || 'your email'}`}
          </p>
        </div>

        {/* Global Error Notice */}
        {errorMessage && (
          <div className="mb-4 p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
            {errorMessage}
          </div>
        )}

        {/* VIEW 1: LOGIN */}
        {authModalView === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. janedoe or jane@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 text-neutral-50 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Credentials */}
            

            <div className="text-center pt-2">
              <span className="text-xs text-neutral-500">Don't have an account? </span>
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 underline decoration-neutral-400 hover:decoration-neutral-900 transition-colors"
              >
                Create one now
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: REGISTER */}
        {authModalView === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="e.g. janedoe"
                className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full pl-9 pr-3.5 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3.5 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 text-neutral-50 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account & Send OTP'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-neutral-500">Already registered? </span>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 underline decoration-neutral-400 hover:decoration-neutral-900 transition-colors"
              >
                Sign in here
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: VERIFY OTP */}
        {authModalView === 'verify-otp' && (
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
            <div className="flex flex-col items-center">
              {lastDispatchedOtp && (
                <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Demo OTP code: <strong>{lastDispatchedOtp}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = lastDispatchedOtp.split('').slice(0, 6);
                      setOtpDigits(digits);
                    }}
                    className="ml-1 text-[11px] underline font-semibold"
                  >
                    (Auto-fill)
                  </button>
                </div>
              )}

              {/* 6-box Pin Input */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputsRef.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-semibold bg-neutral-50 dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-xl focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none transition-all text-neutral-900 dark:text-neutral-100"
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otpDigits.join('').length < 6}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 text-neutral-50 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Verifying...' : 'Verify OTP & Enter'}
              <KeyRound className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
              >
                Back to Sign In
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || isSubmitting}
                onClick={handleResendOtp}
                className="inline-flex items-center gap-1.5 font-medium text-neutral-900 dark:text-neutral-100 hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSubmitting ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
