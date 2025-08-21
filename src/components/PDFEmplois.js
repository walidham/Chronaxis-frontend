import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PDFEmplois = () => {
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    type: 'classes', // classes, teachers, rooms
    department: '',
    academicYear: '',
    semester: 1,
    target: '' // ID de la classe/enseignant/salle ou 'all'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (filters.department && filters.academicYear) {
      fetchTargetData();
    }
  }, [filters.type, filters.department, filters.academicYear]);

  const fetchInitialData = async () => {
    try {
      const [deptRes, yearRes] = await Promise.all([
        axios.get('/api/departments'),
        axios.get('/api/academic-years')
      ]);
      setDepartments(deptRes.data);
      setAcademicYears(yearRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  };

  const fetchTargetData = async () => {
    try {
      if (filters.type === 'classes') {
        const res = await axios.get(`/api/classes?department=${filters.department}&academicYear=${filters.academicYear}`);
        setClasses(res.data);
      } else if (filters.type === 'teachers') {
        const res = await axios.get('/api/teachers');
        setTeachers(res.data.filter(t => t.departments?.some(d => d._id === filters.department)));
      } else if (filters.type === 'rooms') {
        const res = await axios.get('/api/rooms');
        setRooms(res.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'type' && { target: '' })
    }));
  };

  const generatePDF = async () => {
    if (!filters.department || !filters.academicYear) {
      alert('Veuillez sélectionner le département et l\'année universitaire');
      return;
    }

    setLoading(true);
    try {
      const sessions = await fetchSessions();
      createPDF(sessions);
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    const params = new URLSearchParams({
      semester: filters.semester,
      academicYear: filters.academicYear
    });

    if (filters.target && filters.target !== 'all') {
      if (filters.type === 'classes') params.append('class', filters.target);
      else if (filters.type === 'teachers') params.append('teacher', filters.target);
      else if (filters.type === 'rooms') params.append('room', filters.target);
    }

    const response = await axios.get(`/api/sessions?${params}`);
    return response.data;
  };

  const createPDF = (sessions) => {
    const doc = new jsPDF();
    const title = `Emploi du temps - ${filters.type === 'classes' ? 'Classes' : filters.type === 'teachers' ? 'Enseignants' : 'Salles'}`;
    
    doc.setFontSize(16);
    doc.text(title, 20, 20);
    
    // Organiser les données par jour et heure
    const schedule = organizeSchedule(sessions);
    
    // Créer le tableau
    const tableData = createTableData(schedule);
    
    doc.autoTable({
      head: [['Heure', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [102, 126, 234] }
    });

    doc.save(`emploi-du-temps-${filters.type}-${Date.now()}.pdf`);
  };

  const organizeSchedule = (sessions) => {
    const schedule = {};
    const timeSlots = ['08:00-09:30', '09:45-11:15', '11:30-13:00', '14:00-15:30', '15:45-17:15'];
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    timeSlots.forEach(slot => {
      schedule[slot] = {};
      days.forEach(day => {
        schedule[slot][day] = [];
      });
    });

    sessions.forEach(session => {
      const timeSlot = session.timeSlot;
      const day = session.dayOfWeek;
      if (schedule[timeSlot] && schedule[timeSlot][day]) {
        schedule[timeSlot][day].push(session);
      }
    });

    return schedule;
  };

  const createTableData = (schedule) => {
    return Object.entries(schedule).map(([timeSlot, days]) => [
      timeSlot,
      ...Object.values(days).map(sessions => 
        sessions.map(s => `${s.course?.name || ''}\n${s.teacher?.firstName} ${s.teacher?.lastName}`).join('\n')
      )
    ]);
  };

  const getTargetOptions = () => {
    if (filters.type === 'classes') return classes;
    if (filters.type === 'teachers') return teachers;
    if (filters.type === 'rooms') return rooms;
    return [];
  };

  const getTargetLabel = (item) => {
    if (filters.type === 'classes') return item.name;
    if (filters.type === 'teachers') return `${item.firstName} ${item.lastName}`;
    if (filters.type === 'rooms') return item.name;
    return '';
  };

  return (
    <div className="pdf-emplois-page">
      <div className="page-header">
        <h2>Génération PDF - Emplois du temps</h2>
      </div>

      <div className="pdf-form">
        <div className="form-group">
          <label>Type d'emploi :</label>
          <select name="type" value={filters.type} onChange={handleFilterChange}>
            <option value="classes">Classes</option>
            <option value="teachers">Enseignants</option>
            <option value="rooms">Salles</option>
          </select>
        </div>

        <div className="form-group">
          <label>Département :</label>
          <select name="department" value={filters.department} onChange={handleFilterChange}>
            <option value="">Sélectionner un département</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Année universitaire :</label>
          <select name="academicYear" value={filters.academicYear} onChange={handleFilterChange}>
            <option value="">Sélectionner une année</option>
            {academicYears.map(year => (
              <option key={year._id} value={year._id}>{year.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Semestre :</label>
          <select name="semester" value={filters.semester} onChange={handleFilterChange}>
            <option value={1}>Semestre 1</option>
            <option value={2}>Semestre 2</option>
          </select>
        </div>

        <div className="form-group">
          <label>{filters.type === 'classes' ? 'Classe' : filters.type === 'teachers' ? 'Enseignant' : 'Salle'} :</label>
          <select name="target" value={filters.target} onChange={handleFilterChange}>
            <option value="">Sélectionner</option>
            <option value="all">Tous</option>
            {getTargetOptions().map(item => (
              <option key={item._id} value={item._id}>{getTargetLabel(item)}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={generatePDF} 
          disabled={loading || !filters.department || !filters.academicYear}
          className="btn-generate"
        >
          {loading ? 'Génération...' : 'Générer PDF'}
        </button>
      </div>
    </div>
  );
};

export default PDFEmplois;