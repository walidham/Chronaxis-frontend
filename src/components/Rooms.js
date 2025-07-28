import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Rooms.css';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    type: 'CLASSROOM',
    building: '',
    floor: '',
    isAvailable: true
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/rooms');
      setRooms(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des salles:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        capacity: Number(formData.capacity),
        floor: formData.floor ? Number(formData.floor) : undefined
      };
      
      if (editingRoom) {
        await axios.put(`/api/rooms/${editingRoom._id}`, dataToSubmit);
      } else {
        await axios.post('/api/rooms', dataToSubmit);
      }
      fetchRooms();
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette salle ?')) {
      try {
        await axios.delete(`/api/rooms/${id}`);
        fetchRooms();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const openModal = (room = null) => {
    setEditingRoom(room);
    setFormData(room ? {
      name: room.name,
      capacity: room.capacity,
      type: room.type,
      building: room.building || '',
      floor: room.floor || '',
      isAvailable: room.isAvailable
    } : {
      name: '',
      capacity: '',
      type: 'CLASSROOM',
      building: '',
      floor: '',
      isAvailable: true
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRoom(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const getRoomTypeLabel = (type) => {
    switch (type) {
      case 'CLASSROOM': return 'Salle de cours';
      case 'LAB': return 'Laboratoire';
      case 'AMPHITHEATER': return 'Amphithéâtre';
      default: return type;
    }
  };

  const getRoomTypeIcon = (type) => {
    switch (type) {
      case 'CLASSROOM': return '🏫';
      case 'LAB': return '🔬';
      case 'AMPHITHEATER': return '🎭';
      default: return '🏢';
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="rooms-page">
      <div className="page-header">
        <h2>Gestion des Salles</h2>
        <button onClick={() => openModal()} className="btn-add">
          + Ajouter Salle
        </button>
      </div>

      <div className="rooms-grid">
        {rooms.map(room => (
          <div key={room._id} className={`room-card ${!room.isAvailable ? 'unavailable' : ''}`}>
            <div className="room-info">
              <div className="room-header">
                <h3>{room.name}</h3>
                <span className="room-type-icon">{getRoomTypeIcon(room.type)}</span>
              </div>
              <p className="room-type">{getRoomTypeLabel(room.type)}</p>
              <p className="room-capacity">Capacité: {room.capacity} places</p>
              {room.building && <p className="room-building">Bâtiment: {room.building}</p>}
              {room.floor !== undefined && <p className="room-floor">Étage: {room.floor}</p>}
              <div className="room-status">
                <span className={`status-indicator ${room.isAvailable ? 'available' : 'unavailable'}`}></span>
                <span>{room.isAvailable ? 'Disponible' : 'Indisponible'}</span>
              </div>
            </div>
            <div className="room-actions">
              <button 
                onClick={() => openModal(room)}
                className="btn-edit-small"
              >
                ✏️
              </button>
              <button 
                onClick={() => handleDelete(room._id)}
                className="btn-delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="no-data">
          <p>Aucune salle trouvée. Cliquez sur "Ajouter Salle" pour commencer.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRoom ? 'Modifier Salle' : 'Ajouter Salle'}</h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nom de la salle:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Type:</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="CLASSROOM">Salle de cours</option>
                  <option value="LAB">Laboratoire</option>
                  <option value="AMPHITHEATER">Amphithéâtre</option>
                </select>
              </div>
              <div className="form-group">
                <label>Capacité:</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Bâtiment:</label>
                <input
                  type="text"
                  name="building"
                  value={formData.building}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Étage:</label>
                <input
                  type="number"
                  name="floor"
                  value={formData.floor}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleChange}
                  />
                  Disponible
                </label>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-save">
                  {editingRoom ? 'Modifier' : 'Ajouter'}
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

export default Rooms;