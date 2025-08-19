'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/* -------- Config -------- */
const API_ROOT = process.env.NEXT_PUBLIC_API_URL || '/api';

/* -------- Types -------- */
type Exam = {
  _id?: string;
  id?: string;                 // some legacy data may use id
  title: string;
  description: string;
  targetAudience: string;
  createdAt?: string;
};

/* -------- Small API helpers (client-side) -------- */
async function apiGet<T>(path: string): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${API_ROOT}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Request failed');
  return data as T;
}

async function apiPost<T>(path: string, body: any): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${API_ROOT}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Request failed');
  return data as T;
}

async function fetchExams(): Promise<Exam[]> {
  const data = await apiGet<any>('/exams');
  // backend might return an array or { exams: [...] }
  return Array.isArray(data) ? data : data.exams || [];
}

async function createExam(payload: {
  title: string;
  description: string;
  targetAudience: string;
  createdAt?: string;
}): Promise<Exam> {
  // server will assign _id; no need to send custom id
  return apiPost<Exam>('/exams', payload);
}

/* -------- Page -------- */
export default function TeacherExamsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [error, setError] = useState<string | null>(null);

  // modal state
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          router.replace('/login');
          return;
        }
        setLoading(true);
        setError(null);
        const list = await fetchExams();
        setExams(list);
      } catch (e: any) {
        setError(e?.message || 'Failed to load exams');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  function logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    router.replace('/');
  }

  async function onCreateExam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setCreating(true);
      setError(null);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        targetAudience: targetAudience.trim(),
        createdAt: new Date().toISOString(),
      };
      if (!payload.title || !payload.description || !payload.targetAudience) {
        throw new Error('Please fill in all fields');
      }

      await createExam(payload);
      // reset form + close modal
      setTitle('');
      setDescription('');
      setTargetAudience('');
      setOpen(false);

      // reload exams
      setLoading(true);
      const list = await fetchExams();
      setExams(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to create exam');
    } finally {
      setCreating(false);
      setLoading(false);
    }
  }

  function cardId(e: Exam) {
    return e._id || e.id || '';
  }

  return (
    <section className="dashboard w-screen h-screen p-24">
      <h1>Teacher Dashboard</h1>

      <div className="dashboard-actions" style={{ display: 'flex', gap: 8, margin: '12px 0 16px' }}>
        <button id="create-exam-btn" className="primary-btn" onClick={() => setOpen(true)}>
          Create New Exam
        </button>
        <button id="logout-btn" className="secondary-btn" onClick={logout}>
          Logout
        </button>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: 12, color: '#b00020' }}>
          {error}
        </div>
      )}

      <div id="dashboard-content">
        {loading ? (
          <div className="loading">Loading exams...</div>
        ) : exams.length === 0 ? (
          <div className="no-exams-message" style={emptyStateStyle}>
            <p>No exams created yet.</p>
            <p>Click "Create New Exam" to add one.</p>
          </div>
        ) : (
          <div className="exam-cards-container" style={cardsGridStyle}>
            {exams.map((e) => {
              const id = cardId(e);
              return (
                <div
                  key={id}
                  className="exam-card"
                  style={cardStyle}
                  onClick={() => router.push(`/teacher/exams/${id}`)}
                  role="button"
                >
                  <h3 className="exam-title" style={{ marginTop: 0 }}>{e.title}</h3>
                  <div className="exam-audience" style={{ margin: '6px 0' }}>
                    <span className="audience-label" style={{ color: '#666' }}>Audience:</span>{' '}
                    <span className="audience-value">{e.targetAudience}</span>
                  </div>
                  <p className="exam-description">
                    {truncate(e.description || '', 100)}
                  </p>
                  <div className="exam-meta" style={{ color: '#666', fontSize: 13 }}>
                    <span>
                      Created:{' '}
                      {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Exam Modal */}
      {open && (
        <div
          id="create-exam-dialog"
          className="dialog-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          style={overlayStyle}
        >
          <div className="dialog-content" style={dialogStyle}>
            <h2>Create New Exam</h2>
            <form id="create-exam-form" onSubmit={onCreateExam} style={{ display: 'grid', gap: 12 }}>
              <div className="form-group" style={{ display: 'grid', gap: 6 }}>
                <label htmlFor="exam-title">Title</label>
                <input
                  id="exam-title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'grid', gap: 6 }}>
                <label htmlFor="exam-description">Description</label>
                <textarea
                  id="exam-description"
                  name="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'grid', gap: 6 }}>
                <label htmlFor="exam-target">Target Audience</label>
                <input
                  id="exam-target"
                  name="targetAudience"
                  placeholder="e.g., 2e année MIP, S4, groupe A"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  required
                />
              </div>

              <div id="exam-error" className="form-error" />

              <div className="form-actions" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  id="cancel-create-exam"
                  className="secondary-btn"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" id="submit-exam-btn" className="primary-btn" disabled={creating}>
                  {creating ? 'Creating…' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

/* -------- Helpers -------- */
function truncate(text: string, max = 100) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

/* -------- Inline styles (replace with your CSS if you like) -------- */
const cardsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e5e5',
  borderRadius: 8,
  padding: 16,
  background: '#fff',
  cursor: 'pointer',
};

const emptyStateStyle: React.CSSProperties = {
  border: '1px dashed #ddd',
  padding: 24,
  borderRadius: 8,
  textAlign: 'center',
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.35)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 50,
};

const dialogStyle: React.CSSProperties = {
  width: 520,
  maxWidth: '92vw',
  background: '#fff',
  borderRadius: 10,
  padding: 20,
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
};