'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../../../lib/api/auth';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { token } = await login({ email, password,role });
      localStorage.setItem('token', token);
      if (role === 'student') router.push('/student');
      else router.push('/teacher');
    } catch (err: any) {
      alert(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-container w-screen flex justify-center">
      <div className="login-card" >
        <h2 className='text-2xl font-semibold text-primary'>Login</h2>
        <form id="login-form" className="login-form flex flex-col gap-6 w-full" onSubmit={onSubmit} >
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className='text-black p-2 rounded-md border border-dark'
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className='text-black p-2 rounded-md border border-dark'
          />
          <select
            name="role"
            required
            value={role}
            onChange={e => setRole(e.target.value as 'student' | 'teacher')}
            className='text-black p-2 rounded-md border border-dark'
          >
            <option value="" disabled>Select Role</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
          <button type="submit" className='text-white cursor-pointer' disabled={loading}>
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>
      </div>
    </main>
  );
}