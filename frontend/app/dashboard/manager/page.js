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

export default function ManagerDashboard() {
  const [requests, setRequests] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/requests/');
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    }
  };

  const fetchStaffUsers = async () => {
    try {
      const res = await api.get('/api/users/staff/');
      setStaffUsers(res.data);
      if (res.data.length > 0) {
        setSelectedStaffId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch staff users', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchStaffUsers();
  }, []);

  const openAssignModal = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const closeAssignModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleAssign = async () => {
    if (!selectedStaffId) return;
    setIsAssigning(true);
    try {
      await api.post(
        `/api/requests/${selectedRequest.id}/assign/`,
        { staff_user_id: selectedStaffId },
        { headers: { 'X-CSRFToken': getCSRFToken() } }
      );
      closeAssignModal();
      fetchRequests();
    } catch (err) {
      console.error('Failed to assign request', err);
      alert('Failed to assign request.');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['manager']}>
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <Navbar />
        
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          
          <section style={{
            backgroundColor: 'white', borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', padding: '1.5rem', borderBottom: '1px solid #e5e7eb', color: '#111827', margin: 0 }}>
              All Maintenance Requests
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#f9fafb', color: '#6b7280', fontSize: '0.875rem' }}>
                  <tr>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>ID</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Title</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Status</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Submitted By</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Assigned To</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Date</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>Action</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.875rem', color: '#374151' }}>
                  {requests.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem 1.5rem', color: '#6b7280' }}>#{req.id}</td>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: '#111827' }}>{req.title}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem', borderRadius: '9999px',
                          fontSize: '0.75rem', fontWeight: '500', ...getStatusStyle(req.status)
                        }}>
                          {req.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>{req.created_by?.username}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>{req.assigned_to?.username || '—'}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {req.status === 'Pending' && (
                          <button
                            onClick={() => openAssignModal(req)}
                            style={{
                              padding: '0.4rem 0.75rem', backgroundColor: '#10b981',
                              color: 'white', borderRadius: '4px', border: 'none',
                              cursor: 'pointer', fontWeight: '500', fontSize: '0.75rem'
                            }}
                          >
                            Assign
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
                        No requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </main>

        {isModalOpen && selectedRequest && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 50
          }}>
            <div style={{
              backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
              width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#111827' }}>
                Assign Request
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Assign "{selectedRequest.title}" to a maintenance staff member.
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Select Staff Member
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  style={{
                    width: '100%', padding: '0.75rem', border: '1px solid #d1d5db',
                    borderRadius: '6px', outline: 'none', backgroundColor: 'white'
                  }}
                >
                  {staffUsers.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.username}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  onClick={closeAssignModal}
                  disabled={isAssigning}
                  style={{
                    padding: '0.5rem 1rem', backgroundColor: 'transparent', color: '#4b5563',
                    border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={isAssigning}
                  style={{
                    padding: '0.5rem 1rem', backgroundColor: '#2563eb', color: 'white',
                    border: 'none', borderRadius: '6px', cursor: isAssigning ? 'not-allowed' : 'pointer',
                    fontWeight: '500', opacity: isAssigning ? 0.7 : 1
                  }}
                >
                  {isAssigning ? 'Assigning...' : 'Confirm Assign'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
