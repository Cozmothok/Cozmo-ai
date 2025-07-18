import React, { useState } from 'react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        setMessage(data.message);
        // Redirect or update UI after successful login
      } else {
        setMessage(data.message || data.errors[0].msg || 'Login failed');
      }
    } catch (error) {
      setMessage('Network error or server is down');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0f1f]">
      <form onSubmit={handleSubmit} className="p-8 rounded-lg shadow-lg bg-black/20 border border-cyan-400/20 text-gray-200 w-full max-w-md">
        <h2 className="text-2xl font-bold text-cyan-300 mb-6 text-center">Login</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
        >
          Login
        </button>
        {message && <p className="mt-4 text-center text-sm text-red-400">{message}</p>}
      </form>
    </div>
  );
};

export default LoginPage;