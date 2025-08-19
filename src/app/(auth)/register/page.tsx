'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'student' | 'teacher';
type FormState = {
  email: string;
  password: string;
  userType: Role | '';       
  firstName: string;
  lastName: string;
  dateOfBirth: string;      
  gender: '' | 'male' | 'female';
  institution: string;
  fieldOfStudy: string;
};

const API_ROOT = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    email: '',
    password: '',
    userType: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    institution: '',
    fieldOfStudy: '',
  });
  const [loading, setLoading] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const required: (keyof FormState)[] = [
      'email', 'lastName', 'firstName', 'dateOfBirth', 'gender',
      'institution', 'fieldOfStudy', 'password', 'userType',
    ];
    const missing = required.filter(k => !form[k]);
    if (missing.length) {
      alert(`Please fill in all required fields: ${missing.join(', ')}`);
      return;
    }
    const dob = form.dateOfBirth ? new Date(form.dateOfBirth) : null;
    const dateOfBirth =
      dob && !isNaN(dob.getTime()) ? dob.toISOString().split('T')[0] : form.dateOfBirth;

    setLoading(true);
    try {
      const res = await fetch(`${API_ROOT}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userType: form.userType as Role, dateOfBirth }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || 'Registration failed');

      alert('Registration successful! Please log in.');
      router.push('/login');
    } catch (err: any) {
      alert(err?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-container w-screen" >
      <div className="register-card w-[640] max-w-[92vw] p-12 border border-[#ddd] rounded-lg">
        <h2>Create an Account</h2>
        <form id="register-form" className="register-form" onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <div className="form-group" style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
            <input name="firstName" placeholder="First Name" required value={form.firstName} onChange={e => update('firstName', e.target.value)} />
            <input name="lastName" placeholder="Last Name" required value={form.lastName} onChange={e => update('lastName', e.target.value)} />
          </div>

          <input name="institution" placeholder="Institution" required value={form.institution} onChange={e => update('institution', e.target.value)} />

          <div className="form-group" style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
            <input name="dateOfBirth" type="date" placeholder="Date of Birth" required value={form.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)} />
            <select name="gender" required value={form.gender} onChange={e => update('gender', e.target.value as FormState['gender'])}>
              <option value="" disabled>Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="form-group" style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
            <input name="fieldOfStudy" placeholder="Field of Study/Major" required value={form.fieldOfStudy} onChange={e => update('fieldOfStudy', e.target.value)} />
            <select name="userType" required value={form.userType} onChange={e => update('userType', e.target.value as Role | '')}>
              <option value="" disabled>Select user type</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          <input name="email" type="email" placeholder="Email" required value={form.email} onChange={e => update('email', e.target.value)} />
          <input name="password" type="password" placeholder="Password" required value={form.password} onChange={e => update('password', e.target.value)} />

          <button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Register'}</button>
        </form>
      </div>
    </main>
  );
}