'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function NewPostPage() {
  const { user, loading } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
    if (!loading && user && !['author', 'admin'].includes(user.role)) router.replace('/dashboard');
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { setError('Title and body are required.'); return; }
    setSubmitting(true); setError('');

    const res = await fetch('/api/posts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), body: body.trim(), image_url: imageUrl.trim() || null }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/blog/${data.post.slug}`);
    } else {
      const err = await res.json();
      setError(err.error || 'Failed to create post');
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '6rem' }}><div className="spinner" style={{ margin: '0 auto', width: '32px', height: '32px' }} /></div>;

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="content-container fade-up">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.4rem' }}>Write a New Post</h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem' }}>✦ An AI summary will be generated automatically when you publish.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Give your post a compelling title..." required style={{ fontSize: '1.1rem' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Featured Image URL</label>
            <input type="url" className="form-input" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg (optional)" />
            {imageUrl && (
              <div style={{ marginTop: '0.75rem', borderRadius: '8px', overflow: 'hidden', maxHeight: '240px' }}>
                <img src={imageUrl} alt="Preview" style={{ width: '100%', height: '240px', objectFit: 'cover' }}
                  onError={e => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Content *</label>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginBottom: '0.5rem' }}>
              Use HTML tags for formatting: &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;blockquote&gt;
            </p>
            <textarea className="form-textarea" value={body} onChange={e => setBody(e.target.value)}
              required rows={20} style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
              placeholder="<h2>Introduction</h2>&#10;<p>Your content here...</p>" />
          </div>

          {body && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Preview</label>
              <div className="prose" style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem', maxHeight: '400px', overflow: 'auto' }}
                dangerouslySetInnerHTML={{ __html: body }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? <><span className="spinner" style={{ width: '16px', height: '16px' }} /> Generating AI summary...</> : 'Publish Post ✦'}
            </button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => router.back()} disabled={submitting}>Cancel</button>
          </div>
          {submitting && <div className="alert alert-info" style={{ marginTop: '1rem' }}>✦ Generating AI summary with Google Gemini... This may take a few seconds.</div>}
        </form>
      </div>
    </div>
  );
}
