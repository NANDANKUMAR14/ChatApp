import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const Login: React.FC = () => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const normalizePhone = (value: string) => value.replace(/\D/g, '').slice(0, 10);
  const isValidPhone = (value: string) => /^\d{10}$/.test(value);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const normalizedPhone = normalizePhone(phoneNumber);
    if (!isValidPhone(normalizedPhone)) {
      setError('Phone number must be exactly 10 digits');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/signup', { name, phoneNumber: normalizedPhone, password });
      login(response.data.token, response.data.user);
      navigate('/chat');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const normalizedPhone = normalizePhone(phoneNumber);
    if (!isValidPhone(normalizedPhone)) {
      setError('Phone number must be exactly 10 digits');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/login', { phoneNumber: normalizedPhone, password });
      login(response.data.token, response.data.user);
      navigate('/chat');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = isSignUp ? handleSignUp : handleLogin;

  return (
    <div className="wa-app-shell flex min-h-screen items-center justify-center px-4 py-8">
      <div className="relative z-10 w-full max-w-[980px] overflow-hidden rounded-xl bg-white shadow-[0_6px_18px_rgba(11,20,26,0.18)]">
        <div className="grid md:grid-cols-[1.15fr_1fr]">
          <section className="border-b border-[#e9edef] bg-[#f8f9fa] p-8 md:border-b-0 md:border-r">
            <h1 className="text-3xl font-semibold text-[#111b21]">WhatsApp style chat</h1>
            <p className="mt-3 text-sm leading-6 text-[#667781]">
              Sign in to continue your conversations in a clean WhatsApp-inspired interface.
            </p>

            <div className="mt-6 space-y-3 text-sm text-[#54656f]">
              <div className="rounded-lg bg-white px-4 py-3">Real-time messaging with socket updates</div>
              <div className="rounded-lg bg-white px-4 py-3">Responsive mobile and desktop layout</div>
              <div className="rounded-lg bg-white px-4 py-3">Typing indicators and message status</div>
            </div>
          </section>

          <section className="p-6 sm:p-8">
            <div className="mb-6 grid grid-cols-2 rounded-lg bg-[#f0f2f5] p-1 text-sm font-semibold">
              <button
                onClick={() => {
                  setIsSignUp(false);
                  setError('');
                  setPhoneNumber('');
                  setPassword('');
                }}
                className={`rounded-md py-2 transition ${
                  !isSignUp ? 'bg-white text-[#111b21] shadow-sm' : 'text-[#667781]'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => {
                  setIsSignUp(true);
                  setError('');
                  setName('');
                  setPhoneNumber('');
                  setPassword('');
                }}
                className={`rounded-md py-2 transition ${
                  isSignUp ? 'bg-white text-[#111b21] shadow-sm' : 'text-[#667781]'
                }`}
              >
                Sign Up
              </button>
            </div>

            <h2 className="text-2xl font-semibold text-[#111b21]">{isSignUp ? 'Create account' : 'Sign in'}</h2>
            <p className="mt-1 text-sm text-[#667781]">
              {isSignUp ? 'Create your profile to start chatting.' : 'Use your account credentials to continue.'}
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-[#f4c7c3] bg-[#fff5f5] px-4 py-3 text-sm text-[#a03f37]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {isSignUp && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#111b21]">Name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Carter"
                    className="w-full rounded-lg border border-[#d1d7db] bg-white px-4 py-2.5 text-sm text-[#111b21] placeholder:text-[#8696a0] focus:border-[#00a884] focus:outline-none"
                    required
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-[#111b21]">Phone Number</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(normalizePhone(e.target.value))}
                  placeholder="9876543210"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  className="w-full rounded-lg border border-[#d1d7db] bg-white px-4 py-2.5 text-sm text-[#111b21] placeholder:text-[#8696a0] focus:border-[#00a884] focus:outline-none"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-[#111b21]">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[#d1d7db] bg-white px-4 py-2.5 text-sm text-[#111b21] placeholder:text-[#8696a0] focus:border-[#00a884] focus:outline-none"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-[#00a884] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#029778] disabled:cursor-not-allowed disabled:bg-[#9db8c4]"
              >
                {isLoading ? 'Please wait...' : isSignUp ? 'Create account' : 'Login'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};
