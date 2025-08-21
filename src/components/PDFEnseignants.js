import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PDFEnseignants = () => {
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [grades, setGrades] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    department: '',
    academicYear: '',
    semester: 1,
    grade: '' // Filtre optionnel par grade
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [deptRes, yearRes, gradeRes] = await Promise.all([
        axios.get('/api/departments'),
        axios.get('/api/academic-years'),
        axios.get('/api/grades')
      ]);
      setDepartments(deptRes.data);
      setAcademicYears(yearRes.data);
      setGrades(gradeRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const generatePDF = async () => {
    if (!filters.department || !filters.academicYear) {
      alert('Veuillez sélectionner le département et l\'année universitaire');
      return;
    }

    setLoading(true);
    try {
      const teachersWithSessions = await fetchTeachersWithSessions();
      createPDF(teachersWithSessions);
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachersWithSessions = async () => {
    try {
      // Récupérer les sessions pour le semestre
      const sessionsRes = await axios.get(`/api/sessions?semester=${filters.semester}&academicYear=${filters.academicYear}`);
      const sessions = sessionsRes.data;

      // Récupérer tous les enseignants
      const teachersRes = await axios.get('/api/teachers');
      let allTeachers = teachersRes.data;

      // Filtrer par département
      allTeachers = allTeachers.filter(teacher => 
        teacher.departments?.some(dept => dept._id === filters.department)
      );

      // Filtrer par grade si spécifié
      if (filters.grade) {
        allTeachers = allTeachers.filter(teacher => teacher.grade?._id === filters.grade);
      }

      // Ne garder que les enseignants ayant au moins une séance
      const teachersWithSessions = allTeachers.filter(teacher =>
        sessions.some(session => session.teacher?._id === teacher._id)
      );

      return teachersWithSessions;
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      return [];
    }
  };

  const createPDF = (teachersData) => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Liste des Enseignants', 20, 20);
    
    const selectedDept = departments.find(d => d._id === filters.department);
    const selectedYear = academicYears.find(y => y._id === filters.academicYear);
    
    doc.setFontSize(12);
    doc.text(`Département: ${selectedDept?.name || ''}`, 20, 35);
    doc.text(`Année: ${selectedYear?.name || ''} - Semestre ${filters.semester}`, 20, 45);
    
    if (filters.grade) {
      const selectedGrade = grades.find(g => g._id === filters.grade);
      doc.text(`Grade: ${selectedGrade?.name || ''}`, 20, 55);
    }

    // Préparer les données du tableau
    const tableData = teachersData.map((teacher, index) => [
      index + 1,
      `${teacher.firstName} ${teacher.lastName}`,
      teacher.grade?.name || '',
      teacher.specialization || '',
      teacher.email || ''
    ]);

    doc.autoTable({
      head: [['N°', 'Nom Complet', 'Grade', 'Spécialisation', 'Email']],
      body: tableData,
      startY: filters.grade ? 65 : 55,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [102, 126, 234] },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
        3: { cellWidth: 45 },
        4: { cellWidth: 50 }
      }
    });

    // Ajouter le total
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total: ${teachersData.length} enseignant(s)`, 20, finalY);

    doc.save(`liste-enseignants-${Date.now()}.pdf`);
  };

  return (
    <div className="pdf-enseignants-page">
      <div className="page-header">
        <h2>Génération PDF - Liste des Enseignants</h2>
      </div>

      <div className="pdf-form">
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
          <label>Grade (optionnel) :</label>
          <select name="grade" value={filters.grade} onChange={handleFilterChange}>
            <option value="">Tous les grades</option>
            {grades.map(grade => (
              <option key={grade._id} value={grade._id}>{grade.name}</option>
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

export default PDFEnseignants;