import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleOAuthToken } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }

    if (token) {
      // Save token and redirect to dashboard
      handleOAuthToken(token);
      refreshUser().then(() => {
        navigate('/dashboard', { replace: true });
      });
    } else {
      setError('No token received from OAuth provider');
    }
  }, [searchParams, navigate, refreshUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-n2f-bg px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-900/30 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-n2f-text mb-2">
            Authentication Failed
          </h1>
          <p className="text-n2f-text-secondary mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-n2f-bg">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-n2f-accent mx-auto mb-4" />
        <p className="text-n2f-text-secondary">Completing sign in...</p>
      </div>
    </div>
  );
}
