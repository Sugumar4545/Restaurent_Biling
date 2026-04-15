import React, { useState, useEffect } from 'react';
import { workersApi, attendanceApi } from '../../utils/api';

function StaffPanel() {
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [activeTab, setActiveTab] = useState('workers');
  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [notification, setNotification] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    name: '',
    role: 'Staff',
    phone: '',
  });

  useEffect(() => {
    loadWorkers();
    loadAttendance();
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [attendanceDate]);

  const loadWorkers = async () => {
    try {
      const data = await workersApi.getAll();
      setWorkers(data);
    } catch (err) {
      console.error('Failed to load workers:', err);
    }
  };

  const loadAttendance = async () => {
    try {
      const data = await attendanceApi.getByDate(attendanceDate);
      setAttendance(data);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWorker) {
        await workersApi.update(editingWorker.id, {
          ...formData,
          is_active: editingWorker.is_active,
        });
        notify('success', 'Worker updated!');
      } else {
        await workersApi.create(formData);
        notify('success', 'Worker added!');
      }
      resetForm();
      loadWorkers();
    } catch (err) {
      notify('error', 'Failed: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this worker?')) return;
    try {
      await workersApi.delete(id);
      notify('success', 'Worker deleted!');
      loadWorkers();
    } catch (err) {
      notify('error', 'Failed: ' + err.message);
    }
  };

  const handleCheckIn = async (workerId) => {
    try {
      await attendanceApi.checkIn(workerId);
      notify('success', 'Checked in!');
      loadAttendance();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleCheckOut = async (workerId) => {
    try {
      await attendanceApi.checkOut(workerId);
      notify('success', 'Checked out!');
      loadAttendance();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleMarkAbsent = async (workerId) => {
    try {
      await attendanceApi.markAbsent(workerId, attendanceDate);
      notify('success', 'Marked absent!');
      loadAttendance();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const startEdit = (worker) => {
    setEditingWorker(worker);
    setFormData({ name: worker.name, role: worker.role, phone: worker.phone || '' });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingWorker(null);
    setFormData({ name: '', role: 'Staff', phone: '' });
  };

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const getRoleBadge = (role) => {
    const colors = {
      Admin: 'bg-purple-100 text-purple-700',
      Chef: 'bg-orange-100 text-orange-700',
      Waiter: 'bg-blue-100 text-blue-700',
      Staff: 'bg-gray-100 text-gray-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const getWorkerAttendance = (workerId) => {
    return attendance.find((a) => a.worker_id === workerId);
  };

  return (
    <div className="p-4">
      {notification && (
        <div
          className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-slide-in ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Staff Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('workers')}
            className={`btn ${activeTab === 'workers' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Workers
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Attendance
          </button>
        </div>
      </div>

      {activeTab === 'workers' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="btn btn-primary"
            >
              + Add Worker
            </button>
          </div>

          {showForm && (
            <div className="card mb-6">
              <h3 className="font-bold text-lg mb-4">
                {editingWorker ? 'Edit Worker' : 'Add New Worker'}
              </h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Chef">Chef</option>
                    <option value="Waiter">Waiter</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="sm:col-span-3 flex gap-2">
                  <button type="submit" className="btn btn-success">
                    {editingWorker ? 'Update' : 'Add'}
                  </button>
                  <button type="button" onClick={resetForm} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2">Name</th>
                  <th className="text-left py-3 px-2">Role</th>
                  <th className="text-left py-3 px-2">Phone</th>
                  <th className="text-left py-3 px-2">Joining Date</th>
                  <th className="text-center py-3 px-2">Status</th>
                  <th className="text-center py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker) => (
                  <tr key={worker.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{worker.name}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getRoleBadge(worker.role)}`}>
                        {worker.role}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500">{worker.phone || '-'}</td>
                    <td className="py-3 px-2 text-gray-500">
                      {new Date(worker.joining_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          worker.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {worker.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => startEdit(worker)}
                        className="text-blue-600 hover:text-blue-800 mr-3 text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(worker.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'attendance' && (
        <>
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="input w-48"
            />
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2">Name</th>
                  <th className="text-left py-3 px-2">Role</th>
                  <th className="text-center py-3 px-2">Status</th>
                  <th className="text-center py-3 px-2">Check In</th>
                  <th className="text-center py-3 px-2">Check Out</th>
                  <th className="text-center py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker) => {
                  const att = getWorkerAttendance(worker.id);
                  return (
                    <tr key={worker.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">{worker.name}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getRoleBadge(worker.role)}`}>
                          {worker.role}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {att ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              att.status === 'Present'
                                ? 'bg-green-100 text-green-700'
                                : att.status === 'Absent'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {att.status}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Not marked</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center text-xs text-gray-500">
                        {att?.check_in
                          ? new Date(att.check_in).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="py-3 px-2 text-center text-xs text-gray-500">
                        {att?.check_out
                          ? new Date(att.check_out).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex gap-1 justify-center">
                          {!att && (
                            <>
                              <button
                                onClick={() => handleCheckIn(worker.id)}
                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                              >
                                Check In
                              </button>
                              <button
                                onClick={() => handleMarkAbsent(worker.id)}
                                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                              >
                                Absent
                              </button>
                            </>
                          )}
                          {att && att.status === 'Present' && !att.check_out && (
                            <button
                              onClick={() => handleCheckOut(worker.id)}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              Check Out
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default StaffPanel;
