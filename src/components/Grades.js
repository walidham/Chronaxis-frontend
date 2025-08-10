import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Grades.css';

const Grades = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: ''
  });

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const response = await axios.get('/api/grades');
      setGrades(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des grades:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGrade) {
        await axios.put(`/api/grades/${editingGrade._id}`, formData);
      } else {
        await axios.post('/api/grades', formData);
      }
      fetchGrades();
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce grade ?')) {
      try {
        await axios.delete(`/api/grades/${id}`);
        fetchGrades();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const openModal = (grade = null) => {
    setEditingGrade(grade);
    setFormData(grade ? {
      name: grade.name,
      abbreviation: grade.abbreviation
    } : {
      name: '',
      abbreviation: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGrade(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="grades-page">
      <div className="page-header">
        <h2>Gestion des Grades</h2>
        <button onClick={() => openModal()} className="btn-add">
          + Ajouter Grade
        </button>
      </div>

      <div className="grades-grid">
        {grades.map(grade => (
          <div key={grade._id} className="grade-card">
            <div className="grade-info">
              <div className="grade-header">
                <h3>{grade.name}</h3>
              </div>
              <p className="grade-abbreviation">
                Abréviation: <strong>{grade.abbreviation}</strong>
              </p>
            </div>
            <div className="grade-actions">
              <button 
                onClick={() => openModal(grade)}
                className="btn-edit-small"
              >
                ✏️
              </button>
              <button 
                onClick={() => handleDelete(grade._id)}
                className="btn-delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {grades.length === 0 && (
        <div className="no-data">
          <p>Aucun grade trouvé. Cliquez sur "Ajouter Grade" pour commencer.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingGrade ? 'Modifier Grade' : 'Ajouter Grade'}</h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nom du grade:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Abréviation:</label>
                <input
                  type="text"
                  name="abbreviation"
                  value={formData.abbreviation}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-save">
                  {editingGrade ? 'Modifier' : 'Ajouter'}
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

export default Grades;