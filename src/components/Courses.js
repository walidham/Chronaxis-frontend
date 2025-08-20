import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Courses.css';
import { useNotificationContext } from '../contexts/NotificationContext';

const Courses = () => {
  const { showSuccess, showError } = useNotificationContext();
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [availableTracks, setAvailableTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [filters, setFilters] = useState({
    department: '',
    semester: ''
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'table'
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    semester: 1,
    hours: {
      lectures: 0,
      tutorials: 0,
      practicals: 0
    },
    department: '',
    track: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, departmentsRes] = await Promise.all([
        axios.get('/api/courses'),
        axios.get('/api/departments')
      ]);
      
      setCourses(coursesRes.data);
      setDepartments(departmentsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await axios.put(`/api/courses/${editingCourse._id}`, formData);
      } else {
        await axios.post('/api/courses', formData);
      }
      fetchData();
      closeModal();
      showSuccess(editingCourse ? 'Cours modifié avec succès' : 'Cours ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showError(error.response?.data?.message || 'Erreur lors de la sauvegarde du cours');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      try {
        await axios.delete(`/api/courses/${id}`);
        fetchData();
        showSuccess('Cours supprimé avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showError('Erreur lors de la suppression du cours');
      }
    }
  };

  const openModal = async (course = null) => {
    setEditingCourse(course);
    
    if (course) {
      // Mode édition
      const departmentId = course.department?._id || '';
      setFormData({
        name: course.name,
        code: course.code,
        semester: course.semester,
        hours: course.hours || { lectures: 0, tutorials: 0, practicals: 0 },
        department: departmentId,
        track: course.track?._id || course.track || ''
      });
      
      // Charger les parcours pour le département du cours
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
        code: '',
        semester: 1,
        hours: { lectures: 0, tutorials: 0, practicals: 0 },
        department: departments.length > 0 ? departments[0]._id : '',
        track: ''
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
    setEditingCourse(null);
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    if (name.startsWith('hours.')) {
      const hourType = name.split('.')[1];
      setFormData({
        ...formData,
        hours: {
          ...formData.hours,
          [hourType]: parseFloat(value) || 0
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: ['semester'].includes(name) ? Number(value) : value
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
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: name === 'semester' ? (value ? Number(value) : '') : value
    });
  };

  const filteredCourses = courses.filter(course => {
    let match = true;
    
    if (filters.department && course.department) {
      match = match && (course.department._id === filters.department);
    }
    
    if (filters.semester && course.semester) {
      match = match && (course.semester === filters.semester);
    }
    
    return match;
  });

  const getTotalHours = (hours) => {
    return (hours?.lectures || 0) + (hours?.tutorials || 0) + (hours?.practicals || 0);
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="courses-page">
      <div className="page-header">
        <h2>Gestion des Cours</h2>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              📊 Grille
            </button>
            <button 
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              📋 Tableau
            </button>
          </div>
          <button 
            onClick={() => openModal()} 
            className="btn-add"
            disabled={departments.length === 0}
          >
            + Ajouter Cours
          </button>
        </div>
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
          <label>Semestre:</label>
          <select 
            name="semester" 
            value={filters.semester} 
            onChange={handleFilterChange}
          >
            <option value="">Tous les semestres</option>
            {[1, 2].map(sem => (
              <option key={sem} value={sem}>Semestre {sem}</option>
            ))}
          </select>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="courses-grid">
          {filteredCourses.map(course => (
            <div key={course._id} className="course-card">
              <div className="course-info">
                <div className="course-header">
                  <h3>{course.name}</h3>
                  <span className="course-code">{course.code}</span>
                </div>
                <p className="course-semester">Semestre {course.semester}</p>
                <p className="course-department">
                  Département: {course.department?.name || 'Non spécifié'}
                </p>
                <div className="course-hours">
                  <div className="hours-breakdown">
                    <span>Cours: {(course.hours?.lectures || 0).toString().replace('.', ',')}h</span>
                    <span>TD: {(course.hours?.tutorials || 0).toString().replace('.', ',')}h</span>
                    <span>TP: {(course.hours?.practicals || 0).toString().replace('.', ',')}h</span>
                  </div>
                  <div className="total-hours">
                    Total: {getTotalHours(course.hours).toString().replace('.', ',')}h
                  </div>
                </div>
              </div>
              <div className="course-actions">
                <button 
                  onClick={() => openModal(course)}
                  className="btn-edit-small"
                >
                  ✏️
                </button>
                <button 
                  onClick={() => handleDelete(course._id)}
                  className="btn-delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="courses-table">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom du cours</th>
                <th>Semestre</th>
                <th>Département</th>
                <th>Filière</th>
                <th>Cours</th>
                <th>TD</th>
                <th>TP</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map(course => (
                <tr key={course._id}>
                  <td className="course-code-cell">{course.code}</td>
                  <td className="course-name-cell">{course.name}</td>
                  <td>S{course.semester}</td>
                  <td>{course.department?.name || '-'}</td>
                  <td>{course.track?.name || course.track || '-'}</td>
                  <td>{(course.hours?.lectures || 0).toString().replace('.', ',')}h</td>
                  <td>{(course.hours?.tutorials || 0).toString().replace('.', ',')}h</td>
                  <td>{(course.hours?.practicals || 0).toString().replace('.', ',')}h</td>
                  <td className="total-hours-cell">{getTotalHours(course.hours).toString().replace('.', ',')}h</td>
                  <td>
                    <div className="table-actions">
                      <button 
                        onClick={() => openModal(course)}
                        className="btn-edit-table"
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(course._id)}
                        className="btn-delete-table"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredCourses.length === 0 && (
        <div className="no-data">
          <p>Aucun cours trouvé. {courses.length > 0 ? 'Essayez de modifier les filtres.' : 'Cliquez sur "Ajouter Cours" pour commencer.'}</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCourse ? 'Modifier Cours' : 'Ajouter Cours'}</h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nom du cours:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Code du cours:</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Semestre:</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                >
                  {[1, 2].map(sem => (
                    <option key={sem} value={sem}>Semestre {sem}</option>
                  ))}
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
                  <option value="">Sélectionner un département</option>
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
              <div className="hours-group">
                <label>Heures d'enseignement:</label>
                <div className="hours-inputs">
                  <div className="hour-input">
                    <label>Cours:</label>
                    <input
                      type="number"
                      name="hours.lectures"
                      value={formData.hours.lectures}
                      onChange={handleChange}
                      min="0"
                      step="0.5"
                      placeholder="ex: 1.5"
                    />
                  </div>
                  <div className="hour-input">
                    <label>TD:</label>
                    <input
                      type="number"
                      name="hours.tutorials"
                      value={formData.hours.tutorials}
                      onChange={handleChange}
                      min="0"
                      step="0.5"
                      placeholder="ex: 0.5"
                    />
                  </div>
                  <div className="hour-input">
                    <label>TP:</label>
                    <input
                      type="number"
                      name="hours.practicals"
                      value={formData.hours.practicals}
                      onChange={handleChange}
                      min="0"
                      step="0.5"
                      placeholder="ex: 1.5"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-save">
                  {editingCourse ? 'Modifier' : 'Ajouter'}
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

export default Courses;