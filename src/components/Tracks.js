import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Tracks.css';
import { useNotificationContext } from '../contexts/NotificationContext';

const Tracks = () => {
  const { showSuccess, showError } = useNotificationContext();
  const [tracks, setTracks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTrack, setEditingTrack] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: ''
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetchTracks();
    }
  }, [selectedDepartment]);

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

  const fetchTracks = async () => {
    try {
      const response = await axios.get(`/api/tracks?department=${selectedDepartment}`);
      setTracks(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des parcours:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTrack) {
        await axios.put(`/api/tracks/${editingTrack._id}`, formData);
        showSuccess('Parcours modifié avec succès');
      } else {
        await axios.post('/api/tracks', formData);
        showSuccess('Parcours ajouté avec succès');
      }
      fetchTracks();
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showError(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce parcours ?')) {
      try {
        await axios.delete(`/api/tracks/${id}`);
        fetchTracks();
        showSuccess('Parcours supprimé avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showError('Erreur lors de la suppression');
      }
    }
  };

  const openModal = (track = null) => {
    setEditingTrack(track);
    setFormData({
      name: track?.name || '',
      code: track?.code || '',
      department: track?.department?._id || selectedDepartment
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTrack(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="tracks-page">
      <div className="page-header">
        <h2>Gestion des Parcours</h2>
        <button 
          onClick={() => openModal()} 
          className="btn-add"
          disabled={!selectedDepartment}
        >
          + Ajouter Parcours
        </button>
      </div>

      <div className="filters-container">
        <div className="filter-group">
          <label>Département:</label>
          <select 
            value={selectedDepartment} 
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">Sélectionner un département</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedDepartment ? (
        <div className="tracks-container">
          <table className="tracks-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom du Parcours</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map(track => (
                <tr key={track._id}>
                  <td>{track.code}</td>
                  <td>{track.name}</td>
                  <td>
                    <button 
                      onClick={() => openModal(track)}
                      className="btn-edit"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDelete(track._id)}
                      className="btn-delete"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tracks.length === 0 && (
            <div className="no-data">
              <p>Aucun parcours trouvé pour ce département.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="no-data">
          <p>Veuillez sélectionner un département pour voir les parcours.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTrack ? 'Modifier Parcours' : 'Ajouter Parcours'}</h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Code:</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  placeholder="Ex: DSI"
                />
              </div>
              <div className="form-group">
                <label>Nom du Parcours:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Développement des Systèmes d'Information"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-save">
                  {editingTrack ? 'Modifier' : 'Ajouter'}
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

export default Tracks;