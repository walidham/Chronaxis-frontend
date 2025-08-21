import React, { useState } from 'react';
import axios from 'axios';

const ChangePassword = ({ onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      await axios.put('/api/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      }, config);
      
      setSuccess('Mot de passe modifié avec succès');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Changer le mot de passe</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="form-group">
            <label>Mot de passe actuel :</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Nouveau mot de passe :</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          
          <div className="form-group">
            <label>Confirmer le nouveau mot de passe :</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          
          <div className="modal-actions">
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Modification...' : 'Modifier'}
            </button>
            <button type="button" onClick={onClose} className="btn-cancel">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;