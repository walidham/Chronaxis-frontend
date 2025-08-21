import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AcademicYears.css';

const AcademicYears = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isActive: true
  });

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const response = await axios.get('/api/academic-years');
      setAcademicYears(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des années universitaires:', error);
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
      
      if (editingYear) {
        await axios.put(`/api/academic-years/${editingYear._id}`, formData, config);
      } else {
        await axios.post('/api/academic-years', formData, config);
      }
      fetchAcademicYears();
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette année universitaire ?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        await axios.delete(`/api/academic-years/${id}`, config);
        fetchAcademicYears();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const openModal = (year = null) => {
    setEditingYear(year);
    setFormData(year ? {
      name: year.name,
      startDate: formatDateForInput(year.startDate),
      endDate: formatDateForInput(year.endDate),
      isActive: year.isActive
    } : {
      name: '',
      startDate: '',
      endDate: '',
      isActive: true
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingYear(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="academic-years-page">
      <div className="page-header">
        <h2>Années Universitaires</h2>
        <button onClick={() => openModal()} className="btn-add">
          + Ajouter Année
        </button>
      </div>

      <div className="academic-years-grid">
        {academicYears.map(year => (
          <div key={year._id} className={`academic-year-card ${year.isActive ? 'active' : ''}`}>
            <div className="academic-year-info">
              <h3>{year.name}</h3>
              <p className="academic-year-dates">
                <span className="date-label">Début:</span> {formatDateForDisplay(year.startDate)}
              </p>
              <p className="academic-year-dates">
                <span className="date-label">Fin:</span> {formatDateForDisplay(year.endDate)}
              </p>
              <div className="academic-year-status">
                <span className={`status-indicator ${year.isActive ? 'active' : 'inactive'}`}></span>
                <span>{year.isActive ? 'Année en cours' : 'Année inactive'}</span>
              </div>
            </div>
            <div className="academic-year-actions">
              <button 
                onClick={openModal.bind(null, year)}
                className="btn-edit-small"
              >
                ✏️
              </button>
              <button 
                onClick={handleDelete.bind(null, year._id)}
                className="btn-delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {academicYears.length === 0 && (
        <div className="no-data">
          <p>Aucune année universitaire trouvée. Cliquez sur "Ajouter Année" pour commencer.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingYear ? 'Modifier Année Universitaire' : 'Ajouter Année Universitaire'}</h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nom de l'année:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="ex: 2023-2024"
                  required
                />
              </div>
              <div className="form-group">
                <label>Date de début:</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date de fin:</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  Année universitaire en cours
                </label>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-save">
                  {editingYear ? 'Modifier' : 'Ajouter'}
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

export default AcademicYears;