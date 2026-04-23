'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Navbar from '../../../components/Navbar';
import api from '../../../lib/axios';
import { getCSRFToken } from '../../../lib/csrf';

const getStatusStyle = (status) => {
  switch (status) {
    case 'Pending':
      return { backgroundColor: '#f3f4f6', color: '#4b5563' };
    case 'In Progress':
      return { backgroundColor: '#dbeafe', color: '#1d4ed8' };
    case 'Completed':
      return { backgroundColor: '#dcfce7', color: '#15803d' };
    default:
      return { backgroundColor: '#f3f4f6', color: '#4b5563' };
  }
};

export default function ResidentDashboard() {
  const [requests, setRequests] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/requests/');
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post(
        '/api/requests/',
        { title, description },
        { headers: { 'X-CSRFToken': getCSRFToken() } }
      );
      setSuccessMsg('Request submitted successfully!');
      setTitle('');
      setDescription('');
      fetchRequests();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to submit request', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['resident']}>
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <Navbar />
        
        <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
          
          <section style={{
            backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>
              Submit New Request
            </h2>
            
            {successMsg && (
              <div style={{
                backgroundColor: '#dcfce7', color: '#15803d', padding: '0.75rem',
                borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem'
              }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <input
                  type="text"
                  placeholder="Request Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '0.75rem', border: '1px solid #d1d5db',
                    borderRadius: '6px', outline: 'none'
                  }}
                />
              </div>
              <div>
                <textarea
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  style={{
                    width: '100%', padding: '0.75rem', border: '1px solid #d1d5db',
                    borderRadius: '6px', outline: 'none', resize: 'vertical'
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  alignSelf: 'flex-start', padding: '0.75rem 1.5rem', backgroundColor: '#2563eb',
                  color: 'white', fontWeight: '500', borderRadius: '6px', border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </section>

          <section style={{
            backgroundColor: 'white', borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', padding: '1.5rem', borderBottom: '1px solid #e5e7eb', color: '#111827', margin: 0 }}>
              My Maintenance Requests
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#f9fafb', color: '#6b7280', fontSize: '0.875rem' }}>
                  <tr>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Request Title</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Description</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Status</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Date Submitted</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.875rem', color: '#374151' }}>
                  {requests.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: '#111827' }}>{req.title}</td>
                      <td style={{ padding: '1rem 1.5rem', maxWidth: '300px' }}>{req.description}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem', borderRadius: '9999px',
                          fontSize: '0.75rem', fontWeight: '500', ...getStatusStyle(req.status)
                        }}>
                          {req.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
                        No requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </main>
      </div>
    </ProtectedRoute>
  );
}
