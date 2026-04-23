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

export default function StaffDashboard() {
  const [requests, setRequests] = useState([]);
  const [editingStatus, setEditingStatus] = useState({});
  const [savedRowId, setSavedRowId] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/requests/');
      setRequests(res.data);
      
      // Initialize local editing state for each row
      const initialStatus = {};
      res.data.forEach(req => {
        initialStatus[req.id] = req.status;
      });
      setEditingStatus(initialStatus);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusChange = (id, newStatus) => {
    setEditingStatus(prev => ({ ...prev, [id]: newStatus }));
  };

  const handleSave = async (id) => {
    const newStatus = editingStatus[id];
    try {
      await api.patch(
        `/api/requests/${id}/`,
        { status: newStatus },
        { headers: { 'X-CSRFToken': getCSRFToken() } }
      );
      
      // Show confirmation on this specific row
      setSavedRowId(id);
      setTimeout(() => setSavedRowId(null), 2000);
      
      // Refresh the list to reflect actual DB state
      fetchRequests();
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update status. Remember, you cannot set it back to Pending.');
      fetchRequests(); // Revert local state on failure
    }
  };

  return (
    <ProtectedRoute allowedRoles={['staff']}>
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <Navbar />
        
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          
          <section style={{
            backgroundColor: 'white', borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', padding: '1.5rem', borderBottom: '1px solid #e5e7eb', color: '#111827', margin: 0 }}>
              My Assigned Tasks
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#f9fafb', color: '#6b7280', fontSize: '0.875rem' }}>
                  <tr>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Request Title</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Description</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Submitted By</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Current Status</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Update Status</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500', width: '150px' }}>Save</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.875rem', color: '#374151' }}>
                  {requests.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: '#111827' }}>{req.title}</td>
                      <td style={{ padding: '1rem 1.5rem', maxWidth: '300px' }}>{req.description}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>{req.created_by?.username}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem', borderRadius: '9999px',
                          fontSize: '0.75rem', fontWeight: '500', ...getStatusStyle(req.status)
                        }}>
                          {req.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <select
                          value={editingStatus[req.id] || req.status}
                          onChange={(e) => handleStatusChange(req.id, e.target.value)}
                          style={{
                            padding: '0.5rem', border: '1px solid #d1d5db',
                            borderRadius: '4px', outline: 'none'
                          }}
                        >
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleSave(req.id)}
                            style={{
                              padding: '0.5rem 1rem', backgroundColor: '#2563eb',
                              color: 'white', borderRadius: '4px', border: 'none',
                              cursor: 'pointer', fontWeight: '500'
                            }}
                          >
                            Save
                          </button>
                          {savedRowId === req.id && (
                            <span style={{ color: '#15803d', fontSize: '0.75rem', fontWeight: '500' }}>
                              Saved!
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
                        No tasks assigned.
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
