import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    grade: '',
    specialization: '',
    departments: []
  });

  useEffect(() => {
    fetchTeachers();
    fetchDepartments();
    fetchGrades();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await axios.get('/api/teachers');
      setTeachers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des enseignants:', error);
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

  const fetchGrades = async () => {
    try {
      const response = await axios.get('/api/grades');
      setGrades(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des grades:', error);
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
      
      if (editingTeacher) {
        await axios.put(`/api/teachers/${editingTeacher._id}`, formData, config);
      } else {
        await axios.post('/api/teachers', formData, config);
      }
      fetchTeachers();
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        await axios.delete(`/api/teachers/${id}`, config);
        fetchTeachers();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const openModal = (teacher = null) => {
    setEditingTeacher(teacher);
    setFormData(teacher ? {
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      grade: teacher.grade?._id || '',
      specialization: teacher.specialization || '',
      departments: teacher.departments?.map(d => d._id) || []
    } : {
      firstName: '',
      lastName: '',
      email: '',
      grade: grades.length > 0 ? grades[0]._id : '',
      specialization: '',
      departments: []
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTeacher(null);
    setFormData({ firstName: '', lastName: '', email: '', grade: '', specialization: '', departments: [] });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'departments') {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setFormData({ ...formData, departments: selectedOptions });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="teachers-page">
      <div className="page-header">
        <h2>Gestion des Enseignants</h2>
        <button onClick={() => openModal()} className="btn-add">
          + Ajouter Enseignant
        </button>
      </div>

      <div className="teachers-grid">
        {teachers.map(teacher => (
          <div key={teacher._id} className="teacher-card">
            <div className="teacher-info">
              <h3>{teacher.firstName} {teacher.lastName}</h3>
              <p className="teacher-email">📧 {teacher.email}</p>
              {teacher.grade && (
                <p className="teacher-grade">🏅 {teacher.grade.name}</p>
              )}
              {teacher.specialization && (
                <p className="teacher-specialization">🎓 {teacher.specialization}</p>
              )}
              {teacher.departments?.length > 0 && (
                <p className="teacher-departments">
                  🏢 {teacher.departments.map(d => d.name).join(', ')}
                </p>
              )}
            </div>
            <div className="teacher-actions">
              <button 
                onClick={() => openModal(teacher)}
                className="btn-edit-small"
              >
                ✏️
              </button>
              <button 
                onClick={() => handleDelete(teacher._id)}
                className="btn-delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {teachers.length === 0 && (
        <div className="no-data">
          <p>Aucun enseignant trouvé. Cliquez sur "Ajouter Enseignant" pour commencer.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTeacher ? 'Modifier Enseignant' : 'Ajouter Enseignant'}</h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Prénom:</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nom:</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Grade:</label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionner un grade</option>
                  {grades.map(grade => (
                    <option key={grade._id} value={grade._id}>
                      {grade.name} ({grade.abbreviation})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Spécialisation:</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Départements:</label>
                <select
                  name="departments"
                  multiple
                  value={formData.departments}
                  onChange={handleChange}
                  className="multi-select"
                >
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <small>Maintenez Ctrl/Cmd pour sélectionner plusieurs départements</small>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-save">
                  {editingTeacher ? 'Modifier' : 'Ajouter'}
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

export default Teachers;