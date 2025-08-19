'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ---------- Config ---------- */
const API_ROOT = process.env.NEXT_PUBLIC_API_URL || '/api';

/* ---------- Types ---------- */
type Attempt = {
  _id: string;
  examId?: string;
  exam?: string; // some payloads use 'exam' instead of 'examId'
  startTime?: string;
  endTime?: string;
  score?: number;
};

type Exam = {
  _id: string;
  title: string;
  description?: string;
  targetAudience?: string;
  createdAt?: string;
};

type ExamAttemptsMap = Record<
  string,
  {
    exam: Exam;
    attempts: Attempt[];
  }
>;

/* ---------- API helpers (inline) ---------- */
async function fetchStudentAttempts() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${API_ROOT}/attempts/student`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Failed to load attempts');
  return data; // may be an array or { attempts: [...] }
}

async function fetchExamById(examId: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${API_ROOT}/exams/${examId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Failed to load exam');
  return data; // may be { exam: {...} } or direct exam object
}

/* ---------- Page ---------- */
export default function StudentExamsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [examAttempts, setExamAttempts] = useState<ExamAttemptsMap>({});
  const [error, setError] = useState<string | null>(null);

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

        // 1) Attempts
        const attemptsResp = await fetchStudentAttempts();
        const attempts: Attempt[] = Array.isArray(attemptsResp?.attempts)
          ? attemptsResp.attempts
          : Array.isArray(attemptsResp)
          ? attemptsResp
          : [];

        // 2) Group by exam
        const groups: ExamAttemptsMap = {};
        const toFetch = new Set<string>();

        for (const a of attempts) {
          const id = a.examId || a.exam;
          if (!id) continue;

          if (!groups[id]) {
            groups[id] = { exam: { _id: id, title: 'Loading…' }, attempts: [] };
            toFetch.add(id);
          }
          groups[id].attempts.push(a);
        }

        // 3) Fetch exam details in parallel
        await Promise.all(
          Array.from(toFetch).map(async (id) => {
            try {
              const examResp = await fetchExamById(id);
              const exam = examResp?.exam || examResp;
              if (exam) groups[id].exam = exam;
            } catch {
              groups[id].exam = { _id: id, title: 'Unknown Exam' };
            }
          })
        );

        setExamAttempts(groups);
      }catch (err: unknown) {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : 'Failed to load your exams';

  alert(message);
       } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  const hasExams = useMemo(() => Object.keys(examAttempts).length > 0, [examAttempts]);

  if (loading) {
    return (
      <main className="student-exams" style={{ padding: 24 }}>
        <div className="loading">Loading your exams...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="student-exams" style={{ padding: 24 }}>
        <div className="error-message">
          <h3>Error Loading Exams</h3>
          <p>{error}</p>
          <button className="primary-btn" onClick={() => router.refresh()}>
            Refresh
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="student-exams w-screen h-screen p-12">
      <header className="dashboard-header">
        <h1>My Exams</h1>
        <p>View your exam history and results</p>
      </header>

      <section className="exams-container" style={{ marginTop: 16 }}>
        {hasExams ? <ExamCards examAttempts={examAttempts} /> : <EmptyState />}
      </section>
    </main>
  );
}

/* ---------- Presentational ---------- */
function ExamCards({ examAttempts }: { examAttempts: ExamAttemptsMap }) {
  const cards = Object.values(examAttempts);

  return (
    <div className="exam-cards" style={{ display: 'grid', gap: 16 }}>
      {cards.map(({ exam, attempts }) => {
        const sorted = [...attempts].sort((a, b) => {
          const aTime = new Date(a.endTime || a.startTime || 0).getTime();
          const bTime = new Date(b.endTime || b.startTime || 0).getTime();
          return bTime - aTime;
        });

        const bestScore = sorted.reduce((best, a) => (a.score && a.score > best ? a.score : best), 0);
        const latest = sorted[0];

        return (
          <div key={exam._id} className="exam-card cursor-default" style={cardStyle}>
            <div className="exam-card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>{exam.title}</h2>
              <span className="attempt-count">
                {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="exam-card-body" style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8 }}>
              <div className="score-summary" style={{ textAlign: 'center' }}>
                <div className={`score-circle ${getScoreClass(bestScore)}`} style={scoreCircleStyle}>
                  <span className="score-value" style={{ fontSize: 18, fontWeight: 700 }}>
                    {bestScore}%
                  </span>
                </div>
                <div className="score-label">Best Score</div>
              </div>

              <div className="exam-details" style={{ display: 'grid', gap: 6 }}>
                <Detail label="Last Attempt" value={formatDate(latest?.endTime || latest?.startTime)} />
                <Detail label="Last Score" value={latest?.score != null ? `${latest.score}%` : 'N/A'} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="detail-item" style={{ display: 'flex', gap: 8 }}>
      <span className="detail-label" style={{ color: '#666' }}>{label}:</span>
      <span className="detail-value">{value || 'N/A'}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state" style={emptyStateStyle}>
      <div className="empty-icon" style={{ fontSize: 32 }}>📝</div>
      <h3>No Exams Found</h3>
      <p>You haven&apos;t taken any exams yet. When you complete an exam, it will appear here.</p>
    </div>
  );
}

/* ---------- Utils ---------- */
function getScoreClass(percentage?: number) {
  if (percentage == null) return 'poor';
  if (percentage >= 80) return 'excellent';
  if (percentage >= 60) return 'good';
  if (percentage >= 40) return 'average';
  return 'poor';
}

function formatDate(date?: string) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e5e5',
  borderRadius: 8,
  padding: 16,
  background: '#fff',
};
const scoreCircleStyle: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  border: '3px solid #ddd',
};
const emptyStateStyle: React.CSSProperties = {
  border: '1px dashed #ddd',
  padding: 24,
  borderRadius: 8,
  textAlign: 'center',
};