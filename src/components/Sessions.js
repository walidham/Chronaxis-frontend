import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Sessions.css';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [filters, setFilters] = useState({
    department: '',
    academicYear: '',
    semester: 1
  });
  const [formData, setFormData] = useState({
    course: '',
    teacher: '',
    class: '',
    room: '',
    type: 'LECTURE',
    dayOfWeek: 1,
    timeSlot: 1,
    semester: 1,
    group: ''
  });

  const timeSlots = [
    '8h30-10h00',
    '10h15-11h45', 
    '12h00-13h30',
    '14h30-16h00',
    '16h15-17h45',
    '16h50-18h20'
  ];

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  
  const sessionTypes = {
    'LECTURE': 'Cours',
    'TUTORIAL': 'TD',
    'PRACTICAL': 'TP'
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (filters.department && filters.academicYear) {
      fetchClassesByDepartmentAndYear();
    }
  }, [filters.department, filters.academicYear]);

  useEffect(() => {
    if (classes.length > 0) {
      fetchSessions();
    }
  }, [classes, filters.semester]);

  const fetchData = async () => {
    try {
      const [departmentsRes, academicYearsRes, coursesRes, teachersRes, roomsRes] = await Promise.all([
        axios.get('/api/departments'),
        axios.get('/api/academic-years'),
        axios.get('/api/courses'),
        axios.get('/api/teachers'),
        axios.get('/api/rooms')
      ]);
      
      setDepartments(departmentsRes.data);
      setAcademicYears(academicYearsRes.data);
      setCourses(coursesRes.data);
      setTeachers(teachersRes.data);
      setRooms(roomsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setLoading(false);
    }
  };

  const fetchClassesByDepartmentAndYear = async () => {
    try {
      const response = await axios.get('/api/classes');
      const filteredClasses = response.data.filter(cls => 
        cls.department._id === filters.department && 
        cls.academicYear._id === filters.academicYear
      );
      setClasses(filteredClasses);
    } catch (error) {
      console.error('Erreur lors du chargement des classes:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const classIds = classes.map(cls => cls._id);
      const allSessions = [];
      
      for (const classId of classIds) {
        const response = await axios.get(`/api/sessions?class=${classId}&semester=${filters.semester}`);
        allSessions.push(...response.data);
      }
      
      setSessions(allSessions);
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSession) {
        await axios.put(`/api/sessions/${editingSession._id}`, formData);
      } else {
        await axios.post('/api/sessions', formData);
      }
      fetchSessions();
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(`Erreur: ${error.response?.data?.message || 'Une erreur est survenue'}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette séance ?')) {
      try {
        await axios.delete(`/api/sessions/${id}`);
        fetchSessions();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const openModal = (session = null) => {
    setEditingSession(session && session._id ? session : null);
    
    if (session && session._id) {
      // Mode édition - session existante
      setFormData({
        course: session.course?._id || '',
        teacher: session.teacher?._id || '',
        class: session.class?._id || '',
        room: session.room?._id || '',
        type: session.type || 'LECTURE',
        dayOfWeek: session.dayOfWeek || 1,
        timeSlot: session.timeSlot || 1,
        semester: session.semester || filters.semester,
        group: session.group || ''
      });
    } else if (session && session.class) {
      // Mode ajout avec données pré-remplies depuis le bouton +
      setFormData({
        course: courses.length > 0 ? courses[0]._id : '',
        teacher: teachers.length > 0 ? teachers[0]._id : '',
        class: session.class._id,
        room: rooms.length > 0 ? rooms[0]._id : '',
        type: 'PRACTICAL',
        dayOfWeek: session.dayOfWeek,
        timeSlot: session.timeSlot,
        semester: session.semester,
        group: session.group || ''
      });
    } else {
      // Mode ajout normal
      setFormData({
        course: courses.length > 0 ? courses[0]._id : '',
        teacher: teachers.length > 0 ? teachers[0]._id : '',
        class: classes.length > 0 ? classes[0]._id : '',
        room: rooms.length > 0 ? rooms[0]._id : '',
        type: 'LECTURE',
        dayOfWeek: 1,
        timeSlot: 1,
        semester: filters.semester,
        group: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSession(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['dayOfWeek', 'timeSlot', 'semester'].includes(name) ? Number(value) : value
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: name === 'semester' ? Number(value) : value
    });
  };

  const getSessionsForClassAndSlot = (classId, dayIndex, timeSlotIndex) => {
    return sessions.filter(session => 
      session.class._id === classId && 
      session.dayOfWeek === dayIndex + 1 && 
      session.timeSlot === timeSlotIndex + 1
    );
  };

  const renderSessionCell = (sessions) => {
    if (!sessions || sessions.length === 0) return null;
    
    return (
      <div className="session-cell-wrapper">
        {sessions.map((session, index) => (
          <div 
            key={session._id} 
            className={`session-cell-content ${session.type.toLowerCase()} ${sessions.length > 1 ? 'group-session' : ''}`}
          >
            {sessions.length > 1 && (
              <div className="group-badge">
                {session.group || `Groupe ${index + 1}`}
              </div>
            )}
            <div className="session-course">{session.course.name}</div>
            <div className="session-teacher">{session.teacher.firstName} {session.teacher.lastName}</div>
            <div className="session-room">{session.room.name}</div>
            <div className="session-type">{sessionTypes[session.type]}</div>
            <div className="session-actions">
              <button 
                onClick={() => openModal(session)}
                className="btn-edit-small"
              >
                ✏️
              </button>
              <button 
                onClick={() => handleDelete(session._id)}
                className="btn-delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="sessions-page">
      <div className="page-header">
        <h2>Gestion des Séances</h2>
        <button 
          onClick={() => openModal()} 
          className="btn-add"
          disabled={classes.length === 0}
        >
          + Ajouter Séance
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
            <option value="">Sélectionner un département</option>
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
            <option value="">Sélectionner une année</option>
            {academicYears.map(year => (
              <option key={year._id} value={year._id}>{year.name}</option>
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
            {[1, 2, 3, 4, 5].map(sem => (
              <option key={sem} value={sem}>Semestre {sem}</option>
            ))}
          </select>
        </div>
      </div>

      {classes.length > 0 ? (
        <div className="timetable-container">
          <table className="timetable">
            <thead>
              <tr>
                <th className="class-header">Classe</th>
                {days.map((day, index) => (
                  <th key={index} className="day-header">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr key={cls._id} className="class-row">
                  <td className="class-name">{cls.name}</td>
                  {days.map((day, dayIndex) => (
                    <td key={dayIndex} className="day-cell">
                      <div className="time-slots">
                        {timeSlots.map((timeSlot, timeIndex) => {
                          const sessionsForSlot = getSessionsForClassAndSlot(cls._id, dayIndex, timeIndex);
                          const hasMaxGroups = sessionsForSlot.length >= 2;
                          
                          return (
                            <div key={timeIndex} className="time-slot">
                              <div className="time-label">{timeSlot}</div>
                              <div className="session-cell">
                                {renderSessionCell(sessionsForSlot)}
                                {(!hasMaxGroups) && (
                                  <button 
                                    className="add-session-btn"
                                    onClick={() => openModal({
                                      class: cls,
                                      dayOfWeek: dayIndex + 1,
                                      timeSlot: timeIndex + 1,
                                      semester: filters.semester,
                                      group: sessionsForSlot.length === 1 ? "Groupe 2" : ""
                                    })}
                                  >
                                    +
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-data">
          <p>Veuillez sélectionner un département et une année universitaire pour afficher les séances.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSession?._id ? 'Modifier Séance' : 'Ajouter Séance'}</h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Cours:</label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  required
                >
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>{course.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Enseignant:</label>
                <select
                  name="teacher"
                  value={formData.teacher}
                  onChange={handleChange}
                  required
                >
                  {teachers.map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.firstName} {teacher.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Classe:</label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  required
                >
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Salle:</label>
                <select
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  required
                >
                  {rooms.map(room => (
                    <option key={room._id} value={room._id}>{room.name} ({room.capacity} places)</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Type:</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="LECTURE">Cours</option>
                  <option value="TUTORIAL">TD</option>
                  <option value="PRACTICAL">TP</option>
                </select>
              </div>
              <div className="form-group">
                <label>Jour:</label>
                <select
                  name="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={handleChange}
                  required
                >
                  {days.map((day, index) => (
                    <option key={index} value={index + 1}>{day}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Horaire:</label>
                <select
                  name="timeSlot"
                  value={formData.timeSlot}
                  onChange={handleChange}
                  required
                >
                  {timeSlots.map((slot, index) => (
                    <option key={index} value={index + 1}>{slot}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Semestre:</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                >
                  {[1, 2, 3, 4, 5].map(sem => (
                    <option key={sem} value={sem}>Semestre {sem}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Groupe {formData.type === 'PRACTICAL' ? '(requis pour TP)' : '(optionnel)'}:</label>
                <input
                  type="text"
                  name="group"
                  value={formData.group}
                  onChange={handleChange}
                  placeholder="Ex: Groupe 1"
                  required={formData.type === 'PRACTICAL'}
                />
                {formData.type === 'PRACTICAL' && (
                  <small className="form-hint">Pour les TP, spécifiez le groupe (max 2 groupes par classe)</small>
                )}
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-save">
                  {editingSession?._id ? 'Modifier' : 'Ajouter'}
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

export default Sessions;