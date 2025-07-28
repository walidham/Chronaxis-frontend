import React, { useState, useEffect } from 'react';
import axios from 'axios';

const University = () => {
  const [university, setUniversity] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    directorName: '',
    studiesDirectorName: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUniversity();
  }, []);

  const fetchUniversity = async () => {
    try {
      const response = await axios.get('/api/university');
      setUniversity(response.data);
      setFormData(response.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (error.response?.status === 404) {
        setIsEditing(true);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/university', formData);
      setUniversity(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="university-page">
      <div className="page-header">
        <h2>Informations Université</h2>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn-edit">
            {university ? 'Modifier' : 'Créer'}
          </button>
        )}
      </div>

      {isEditing || !university ? (
        <form onSubmit={handleSubmit} className="university-form">
          <div className="form-group">
            <label>Nom de l'université:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Adresse:</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Nom du directeur:</label>
            <input
              type="text"
              name="directorName"
              value={formData.directorName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Nom du directeur des études:</label>
            <input
              type="text"
              name="studiesDirectorName"
              value={formData.studiesDirectorName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-save">Sauvegarder</button>
            {university && (
              <button 
                type="button" 
                onClick={() => {
                  setIsEditing(false);
                  setFormData(university);
                }}
                className="btn-cancel"
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      ) : university ? (
        <div className="university-info">
          <div className="info-card">
            <h3>{university.name}</h3>
            <p><strong>Adresse:</strong> {university.address}</p>
            <p><strong>Directeur:</strong> {university.directorName}</p>
            <p><strong>Directeur des études:</strong> {university.studiesDirectorName}</p>
          </div>
        </div>
      ) : (
        <div className="no-data">
          <p>Aucune information d'université trouvée. Cliquez sur "Créer" pour ajouter les informations.</p>
        </div>
      )}
    </div>
  );
};

export default University;