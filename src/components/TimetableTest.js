import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TimetableTest.css';

const TimetableTest = () => {
  const [sessions, setSessions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState(null);
  const [draggedSession, setDraggedSession] = useState(null);
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
    '8h30-10h00', '10h10-11h40', '11h50-13h20',
    '13h30-15h00', '15h10-16h40', '16h50-18h20'
  ];
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: name === 'semester' ? Number(value) : value
    });
  };

  const getSessionsForSlot = (classId, dayIndex, timeSlotIndex) => {
    return sessions.filter(session => 
      session.class._id === classId && 
      session.dayOfWeek === dayIndex + 1 && 
      session.timeSlot === timeSlotIndex + 1
    );
  };

  const handleCellClick = (classId, dayIndex, timeSlotIndex) => {
    setSelectedCell({ classId, dayIndex, timeSlotIndex });
  };

  const handleSessionDragStart = (e, session) => {
    setDraggedSession(session);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCellDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCellDrop = async (e, classId, dayIndex, timeSlotIndex) => {
    e.preventDefault();
    if (!draggedSession) return;

    try {
      await axios.put(`/api/sessions/${draggedSession._id}`, {
        ...draggedSession,
        class: classId,
        dayOfWeek: dayIndex + 1,
        timeSlot: timeSlotIndex + 1
      });
      fetchSessions();
      setDraggedSession(null);
    } catch (error) {
      console.error('Erreur lors du déplacement:', error);
    }
  };

  const openModal = (session = null, classId = null, dayIndex = null, timeSlotIndex = null) => {
    setEditingSession(session);
    
    if (session) {
      // Mode édition
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
    } else {
      // Mode ajout
      setFormData({
        course: courses.length > 0 ? courses[0]._id : '',
        teacher: teachers.length > 0 ? teachers[0]._id : '',
        class: classId || (classes.length > 0 ? classes[0]._id : ''),
        room: rooms.length > 0 ? rooms[0]._id : '',
        type: 'LECTURE',
        dayOfWeek: dayIndex !== null ? dayIndex + 1 : 1,
        timeSlot: timeSlotIndex !== null ? timeSlotIndex + 1 : 1,
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

  const deleteSession = async (sessionId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette séance ?')) {
      try {
        await axios.delete(`/api/sessions/${sessionId}`);
        fetchSessions();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
        alert(`Erreur lors de la suppression: ${errorMessage}`);
      }
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'LECTURE': return '#4CAF50';
      case 'TUTORIAL': return '#2196F3';
      case 'PRACTICAL': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  if (loading) return <div className="test-loading">Chargement...</div>;

  return (
    <div className="timetable-test-page">
      <div className="test-page-header">
        <h2>📅 Emploi du Temps Interactif</h2>
        <div className="test-legend">
          <span className="test-legend-item lecture">Cours</span>
          <span className="test-legend-item tutorial">TD</span>
          <span className="test-legend-item practical">TP</span>
        </div>
      </div>

      <div className="test-filters-container">
        <select name="department" value={filters.department} onChange={handleFilterChange}>
          <option value="">Sélectionner un département</option>
          {departments.map(dept => (
            <option key={dept._id} value={dept._id}>{dept.name}</option>
          ))}
        </select>
        <select name="academicYear" value={filters.academicYear} onChange={handleFilterChange}>
          <option value="">Sélectionner une année</option>
          {academicYears.map(year => (
            <option key={year._id} value={year._id}>{year.name}</option>
          ))}
        </select>
        <select name="semester" value={filters.semester} onChange={handleFilterChange}>
          {[1, 2].map(sem => (
            <option key={sem} value={sem}>Semestre {sem}</option>
          ))}
        </select>
      </div>

      {classes.length > 0 ? (
        <div className="test-timetable-grid">
          <div className="test-grid-header">
            <div className="test-time-header">Classes</div>
            {days.map(day => (
              <div key={day} className="test-day-header">{day}</div>
            ))}
          </div>

          {classes.map(cls => (
            <div key={cls._id} className="test-class-row">
              <div className="test-class-label">{cls.name}</div>
              {days.map((day, dayIndex) => (
                <div key={dayIndex} className="test-day-column">
                  {timeSlots.map((timeSlot, timeIndex) => {
                    const sessionsForSlot = getSessionsForSlot(cls._id, dayIndex, timeIndex);
                    const isSelected = selectedCell?.classId === cls._id && 
                                     selectedCell?.dayIndex === dayIndex && 
                                     selectedCell?.timeSlotIndex === timeIndex;

                    return (
                      <div
                        key={timeIndex}
                        className={`test-time-cell ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleCellClick(cls._id, dayIndex, timeIndex)}
                        onDragOver={handleCellDragOver}
                        onDrop={(e) => handleCellDrop(e, cls._id, dayIndex, timeIndex)}
                      >
                        <div className="test-time-label">{timeSlot}</div>
                        <div className="test-sessions-container">
                          {sessionsForSlot.map(session => (
                            <div
                              key={session._id}
                              className="test-session-block"
                              style={{ backgroundColor: getTypeColor(session.type) }}
                              draggable
                              onDragStart={(e) => handleSessionDragStart(e, session)}
                            >
                              <div className="test-session-course">{session.course.code}</div>
                              <div className="test-session-teacher">
                                {session.teacher.firstName} {session.teacher.lastName}
                              </div>
                              <div className="test-session-room">{session.room.name}</div>
                              {session.group && (
                                <div className="test-session-group">{session.group}</div>
                              )}
                              <button
                                className="test-delete-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSession(session._id);
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          {sessionsForSlot.length === 0 && (
                            <button
                              className="test-add-session-btn"
                              onClick={() => openModal(null, cls._id, dayIndex, timeIndex)}
                            >
                              +
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="test-no-data">
          <p>Veuillez sélectionner un département et une année universitaire.</p>
        </div>
      )}

      <div className="test-instructions">
        <h3>Instructions :</h3>
        <ul>
          <li>🖱️ Cliquez sur + pour ajouter une séance</li>
          <li>🔄 Glissez-déposez les séances pour les déplacer</li>
          <li>❌ Cliquez sur × pour supprimer une séance</li>
          <li>🎨 Les couleurs indiquent le type : Vert=Cours, Bleu=TD, Orange=TP</li>
        </ul>
      </div>

      {showModal && (
        <div className="test-modal-overlay" onClick={closeModal}>
          <div className="test-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="test-modal-header">
              <h3>{editingSession ? 'Modifier Séance' : 'Ajouter Séance'}</h3>
              <button onClick={closeModal} className="test-modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit} className="test-modal-form">
              <div className="test-form-group">
                <label>Cours:</label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionner un cours</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>{course.name}</option>
                  ))}
                </select>
              </div>
              <div className="test-form-group">
                <label>Enseignant:</label>
                <select
                  name="teacher"
                  value={formData.teacher}
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionner un enseignant</option>
                  {teachers.map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.firstName} {teacher.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="test-form-group">
                <label>Classe:</label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="test-form-group">
                <label>Salle:</label>
                <select
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionner une salle</option>
                  {rooms.map(room => (
                    <option key={room._id} value={room._id}>{room.name} ({room.capacity} places)</option>
                  ))}
                </select>
              </div>
              <div className="test-form-group">
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
              <div className="test-form-group">
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
              <div className="test-form-group">
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
              <div className="test-form-group">
                <label>Groupe (optionnel):</label>
                <input
                  type="text"
                  name="group"
                  value={formData.group}
                  onChange={handleChange}
                  placeholder="Ex: Groupe 1"
                />
              </div>
              <div className="test-modal-actions">
                <button type="submit" className="test-btn-save">
                  {editingSession ? 'Modifier' : 'Ajouter'}
                </button>
                <button type="button" onClick={closeModal} className="test-btn-cancel">
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

export default TimetableTest;