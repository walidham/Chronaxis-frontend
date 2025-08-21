import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    head: ''
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/departments');
      setDepartments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des départements:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      if (editingDepartment) {
        await axios.put(`/api/departments/${editingDepartment._id}`, formData, config);
      } else {
        await axios.post('/api/departments', formData, config);
      }
      fetchDepartments();
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce département ?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        await axios.delete(`/api/departments/${id}`, config);
        fetchDepartments();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const openModal = (department = null) => {
    setEditingDepartment(department);
    setFormData(department ? {
      name: department.name,
      description: department.description || '',
      head: department.head
    } : {
      name: '',
      description: '',
      head: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDepartment(null);
    setFormData({ name: '', description: '', head: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="departments-page">
      <div className="page-header">
        <h2>Gestion des Départements</h2>
        <button onClick={() => openModal()} className="btn-add">
          + Ajouter Département
        </button>
      </div>

      <div className="departments-grid">
        {departments.map(department => (
          <div key={department._id} className="department-card">
            <div className="department-info">
              <h3>{department.name}</h3>
              <p className="department-head">Chef: {department.head}</p>
              {department.description && (
                <p className="department-description">{department.description}</p>
              )}
            </div>
            <div className="department-actions">
              <button 
                onClick={() => openModal(department)}
                className="btn-edit-small"
              >
                ✏️
              </button>
              <button 
                onClick={() => handleDelete(department._id)}
                className="btn-delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {departments.length === 0 && (
        <div className="no-data">
          <p>Aucun département trouvé. Cliquez sur "Ajouter Département" pour commencer.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDepartment ? 'Modifier Département' : 'Ajouter Département'}</h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nom du département:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Chef de département:</label>
                <input
                  type="text"
                  name="head"
                  value={formData.head}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-save">
                  {editingDepartment ? 'Modifier' : 'Ajouter'}
                </button>
                <button type="button" onClick={closeModal} className="btn-cancel">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;