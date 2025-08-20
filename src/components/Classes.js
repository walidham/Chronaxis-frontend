import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Classes.css';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [availableTracks, setAvailableTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [filters, setFilters] = useState({
    department: '',
    academicYear: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    level: 1,
    track: '',
    department: '',
    academicYear: '',
    students: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [filters]);

  const fetchData = async () => {
    try {
      const [classesRes, departmentsRes, academicYearsRes] = await Promise.all([
        axios.get('/api/classes'),
        axios.get('/api/departments'),
        axios.get('/api/academic-years')
      ]);
      
      setClasses(classesRes.data);
      setDepartments(departmentsRes.data);
      setAcademicYears(academicYearsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      let url = '/api/classes';
      const params = new URLSearchParams();
      
      if (filters.department) params.append('department', filters.department);
      if (filters.academicYear) params.append('academicYear', filters.academicYear);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      setClasses(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des classes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await axios.put(`/api/classes/${editingClass._id}`, formData);
      } else {
        await axios.post('/api/classes', formData);
      }
      fetchClasses();
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) {
      try {
        await axios.delete(`/api/classes/${id}`);
        fetchClasses();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const openModal = async (classItem = null) => {
    setEditingClass(classItem);
    
    if (classItem) {
      // Mode édition
      const departmentId = classItem.department?._id || classItem.department;
      setFormData({
        name: classItem.name,
        level: classItem.level,
        track: classItem.track?._id || classItem.track || '',
        department: departmentId,
        academicYear: classItem.academicYear?._id || classItem.academicYear,
        students: classItem.students
      });
      
      // Charger les parcours pour le département de la classe
      if (departmentId) {
        try {
          const response = await axios.get(`/api/tracks?department=${departmentId}`);
          setAvailableTracks(response.data);
        } catch (error) {
          console.error('Erreur lors du chargement des parcours:', error);
          setAvailableTracks([]);
        }
      }
    } else {
      // Mode ajout
      setFormData({
        name: '',
        level: 1,
        track: '',
        department: departments.length > 0 ? departments[0]._id : '',
        academicYear: academicYears.length > 0 ? academicYears[0]._id : '',
        students: 0
      });
      
      // Charger les parcours pour le premier département
      if (departments.length > 0) {
        try {
          const response = await axios.get(`/api/tracks?department=${departments[0]._id}`);
          setAvailableTracks(response.data);
        } catch (error) {
          console.error('Erreur lors du chargement des parcours:', error);
          setAvailableTracks([]);
        }
      }
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClass(null);
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'level' || name === 'students' ? Number(value) : value
    });
    
    // Si le département change, charger les parcours correspondants
    if (name === 'department' && value) {
      try {
        const response = await axios.get(`/api/tracks?department=${value}`);
        setAvailableTracks(response.data);
        // Réinitialiser le parcours sélectionné
        setFormData(prev => ({
          ...prev,
          department: value,
          track: response.data.length > 0 ? response.data[0]._id : ''
        }));
      } catch (error) {
        console.error('Erreur lors du chargement des parcours:', error);
        setAvailableTracks([]);
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const getLevelName = (level) => {
    switch (level) {
      case 1: return '1ère année';
      case 2: return '2ème année';
      case 3: return '3ème année';
      default: return `Niveau ${level}`;
    }
  };

  const filteredClasses = classes.filter(cls => {
    let match = true;
    
    if (filters.department && cls.department) {
      match = match && (cls.department._id === filters.department || cls.department === filters.department);
    }
    
    if (filters.academicYear && cls.academicYear) {
      match = match && (cls.academicYear._id === filters.academicYear || cls.academicYear === filters.academicYear);
    }
    
    return match;
  });

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="classes-page">
      <div className="page-header">
        <h2>Gestion des Classes</h2>
        <button onClick={() => openModal()} className="btn-add">
          + Ajouter Classe
        </button>
      </div>

      <div className="filters-container">
        <div className="filter-group">
          <label>Département:</label>
          <select 
            name="department" 
            value={filters.department} 
            onChange={handleFilterChange}
          >
            <option value="">Tous les départements</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Année universitaire:</label>
          <select 
            name="academicYear" 
            value={filters.academicYear} 
            onChange={handleFilterChange}
          >
            <option value="">Toutes les années</option>
            {academicYears.map(year => (
              <option key={year._id} value={year._id}>{year.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="classes-grid">
        {filteredClasses.map(cls => (
          <div key={cls._id} className="class-card">
            <div className="class-info">
              <h3>{cls.name}</h3>
              <p className="class-level">{getLevelName(cls.level)}</p>
              <p className="class-track">
                Filière: {cls.track?.name || cls.track || 'Non spécifiée'}
              </p>
              <p className="class-department">
                Département: {cls.department?.name || 'Non spécifié'}
              </p>
              <p className="class-academic-year">
                Année universitaire: {cls.academicYear?.name || 'Non spécifiée'}
              </p>
              <p className="class-students">
                Nombre d'étudiants: {cls.students}
              </p>
            </div>
            <div className="class-actions">
              <button 
                onClick={() => openModal(cls)}
                className="btn-edit-small"
              >
                ✏️
              </button>
              <button 
                onClick={() => handleDelete(cls._id)}
                className="btn-delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="no-data">
          <p>Aucune classe trouvée. {classes.length > 0 ? 'Essayez de modifier les filtres.' : 'Cliquez sur "Ajouter Classe" pour commencer.'}</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingClass ? 'Modifier Classe' : 'Ajouter Classe'}</h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nom de la classe:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Niveau:</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  required
                >
                  <option value={1}>1ère année</option>
                  <option value={2}>2ème année</option>
                  <option value={3}>3ème année</option>
                </select>
              </div>
              <div className="form-group">
                <label>Département:</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Filière:</label>
                <select
                  name="track"
                  value={formData.track}
                  onChange={handleChange}
                  required
                  disabled={!formData.department}
                >
                  <option value="">Sélectionner une filière</option>
                  {availableTracks.map(track => (
                    <option key={track._id} value={track._id}>{track.name} ({track.code})</option>
                  ))}
                </select>
                {!formData.department && (
                  <small className="form-hint">Sélectionnez d'abord un département</small>
                )}
              </div>
              <div className="form-group">
                <label>Année universitaire:</label>
                <select
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  required
                >
                  {academicYears.map(year => (
                    <option key={year._id} value={year._id}>{year.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Nombre d'étudiants:</label>
                <input
                  type="number"
                  name="students"
                  value={formData.students}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-save">
                  {editingClass ? 'Modifier' : 'Ajouter'}
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

export default Classes;