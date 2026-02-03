import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, login } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Zap } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!acceptedTerms) {
      setError('You must accept the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);

    const registerResponse = await register(email, password);

    if (!registerResponse.success) {
      setError(registerResponse.error?.message || 'Registration failed');
      setLoading(false);
      return;
    }

    // Auto-login after registration
    const loginResponse = await login(email, password);

    if (loginResponse.success) {
      await refreshUser();
      navigate('/dashboard');
    } else {
      // Registration succeeded but login failed - redirect to login
      navigate('/login');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-n2f-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="bg-n2f-accent p-3 rounded-xl">
              <Zap className="h-8 w-8 text-gray-900" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-n2f-text">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-n2f-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-n2f-accent hover:text-n2f-accent-light">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="mt-1 text-xs text-n2f-text-muted">
                Must be at least 8 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-n2f-border bg-n2f-card text-n2f-accent focus:ring-n2f-accent focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="terms" className="text-sm text-n2f-text-muted cursor-pointer">
              I agree to the{' '}
              <Link to="/terms" className="text-n2f-accent hover:text-n2f-accent-light">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-n2f-accent hover:text-n2f-accent-light">
                Privacy Policy
              </Link>
            </label>
          </div>
        </form>
      </div>
    </div>
  );
}
