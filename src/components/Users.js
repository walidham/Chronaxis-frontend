import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Users.css';
import { useNotificationContext } from '../contexts/NotificationContext';

const Users = () => {
  const { showSuccess, showError } = useNotificationContext();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'director',
    department: '',
    firstName: '',
    lastName: '',
    isActive: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      setError('Erreur lors du chargement des utilisateurs');
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des départements:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`/api/users/${editingUser._id}`, formData);
      } else {
        await axios.post('/api/users', formData);
      }
      fetchUsers();
      resetForm();
      setShowModal(false);
      showSuccess(editingUser ? 'Utilisateur modifié avec succès' : 'Utilisateur ajouté avec succès');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la sauvegarde';
      setError(errorMessage);
      showError(errorMessage);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      role: user.role,
      department: user.department?._id || '',
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        fetchUsers();
        showSuccess('Utilisateur supprimé avec succès');
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression';
        setError(errorMessage);
        showError(errorMessage);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      role: 'director',
      department: '',
      firstName: '',
      lastName: '',
      isActive: true
    });
    setEditingUser(null);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="users-container">
      <div className="users-header">
        <h2>Gestion des Utilisateurs</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          Ajouter un utilisateur
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Département</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'admin' ? 'Administrateur' : 'Directeur'}
                  </span>
                </td>
                <td>{user.department?.name || '-'}</td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEdit(user)}
                  >
                    Modifier
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(user._id)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}</h3>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Prénom:</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nom:</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              {!editingUser && (
                <div className="form-group">
                  <label>Mot de passe:</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    minLength="6"
                  />
                </div>
              )}
              <div className="form-group">
                <label>Rôle:</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  required
                >
                  <option value="director">Directeur de département</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              {formData.role === 'director' && (
                <div className="form-group">
                  <label>Département:</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner un département</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {editingUser && (
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    />
                    Compte actif
                  </label>
                </div>
              )}
              <div className="form-actions">
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;