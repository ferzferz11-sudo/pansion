import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useLang } from '../LangContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { RL } = useLang();
  const [email, setEmail] = useState('admin@pansion.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Родные Пенаты</h1>
          <p className="text-gray-500">Система управления пансионатом</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 hover:bg-blue-700 font-medium transition disabled:opacity-50">
            {loading ? '...' : 'Войти'}
          </button>
        </form>
        <div className="mt-5 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-0.5">
          <p className="font-medium mb-1">Демо-аккаунты (<b>пароль: admin123</b>):</p>
          <div><span className="text-gray-400 w-24 inline-block">Владелец:</span> admin@pansion.local</div>
          <div><span className="text-gray-400 w-24 inline-block">Управляющий:</span> manager@pansion.local</div>
          <div><span className="text-gray-400 w-24 inline-block">Врач:</span> doctor@pansion.local</div>
          <div><span className="text-gray-400 w-24 inline-block">Горничная:</span> sidorova@pansion.local</div>
        </div>
      </div>
    </div>
  );
}
