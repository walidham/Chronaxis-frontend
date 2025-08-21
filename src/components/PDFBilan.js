import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PDFBilan = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    academicYear: '',
    semester: 1
  });

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const response = await axios.get('/api/academic-years');
      setAcademicYears(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des années:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const generatePDF = async () => {
    if (!filters.academicYear) {
      alert('Veuillez sélectionner l\'année universitaire');
      return;
    }

    setLoading(true);
    try {
      const bilanData = await fetchBilanData();
      createPDF(bilanData);
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setLoading(false);
    }
  };

  const fetchBilanData = async () => {
    try {
      // Récupérer les sessions pour le semestre
      const sessionsRes = await axios.get(`/api/sessions?semester=${filters.semester}&academicYear=${filters.academicYear}`);
      const sessions = sessionsRes.data;

      // Récupérer tous les enseignants
      const teachersRes = await axios.get('/api/teachers');
      const teachers = teachersRes.data;

      // Calculer le bilan pour chaque enseignant
      const bilanData = teachers.map(teacher => {
        const teacherSessions = sessions.filter(session => session.teacher?._id === teacher._id);
        
        let totalHours = 0;
        let coursCount = 0;
        let tdCount = 0;
        let tpCount = 0;

        teacherSessions.forEach(session => {
          const course = session.course;
          if (!course || !course.hours) return;

          if (session.type === 'LECTURE') {
            // Une séance de cours de 1,5h = 1h cours + 0,5h TD
            const lectureHours = course.hours.lectures || 0;
            totalHours += lectureHours * 1; // 1h de cours
            totalHours += lectureHours * 0.5; // 0,5h de TD
            coursCount += 1;
            tdCount += 0.5; // Équivalent TD
          } else if (session.type === 'TUTORIAL') {
            const tutorialHours = course.hours.tutorials || 0;
            totalHours += tutorialHours;
            tdCount += 1;
          } else if (session.type === 'PRACTICAL') {
            const practicalHours = course.hours.practicals || 0;
            totalHours += practicalHours;
            tpCount += 1;
          }
        });

        return {
          teacher,
          totalHours: totalHours.toFixed(1),
          coursCount: coursCount.toFixed(1),
          tdCount: tdCount.toFixed(1),
          tpCount: tpCount.toFixed(1),
          totalSessions: teacherSessions.length
        };
      }).filter(data => data.totalSessions > 0); // Ne garder que ceux avec des séances

      return bilanData.sort((a, b) => b.totalHours - a.totalHours);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      return [];
    }
  };

  const createPDF = (bilanData) => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Bilan Global des Enseignants', 20, 20);
    
    const selectedYear = academicYears.find(y => y._id === filters.academicYear);
    
    doc.setFontSize(12);
    doc.text(`Année: ${selectedYear?.name || ''} - Semestre ${filters.semester}`, 20, 35);

    // Préparer les données du tableau
    const tableData = bilanData.map((data, index) => [
      index + 1,
      `${data.teacher.firstName} ${data.teacher.lastName}`,
      data.teacher.grade?.name || '',
      data.totalHours,
      data.coursCount,
      data.tdCount,
      data.tpCount,
      data.totalSessions
    ]);

    // Calculer les totaux
    const totals = bilanData.reduce((acc, data) => ({
      totalHours: acc.totalHours + parseFloat(data.totalHours),
      coursCount: acc.coursCount + parseFloat(data.coursCount),
      tdCount: acc.tdCount + parseFloat(data.tdCount),
      tpCount: acc.tpCount + parseFloat(data.tpCount),
      totalSessions: acc.totalSessions + data.totalSessions
    }), { totalHours: 0, coursCount: 0, tdCount: 0, tpCount: 0, totalSessions: 0 });

    // Ajouter la ligne de total
    tableData.push([
      '',
      'TOTAL',
      '',
      totals.totalHours.toFixed(1),
      totals.coursCount.toFixed(1),
      totals.tdCount.toFixed(1),
      totals.tpCount.toFixed(1),
      totals.totalSessions
    ]);

    doc.autoTable({
      head: [['N°', 'Enseignant', 'Grade', 'Total H', 'H Cours', 'H TD', 'H TP', 'Séances']],
      body: tableData,
      startY: 45,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [102, 126, 234] },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 50 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 },
        7: { cellWidth: 25 }
      },
      didParseCell: function (data) {
        // Mettre en gras la ligne de total
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
        }
      }
    });

    // Ajouter les informations sur la formule
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.text('Note: Une séance de cours de 1,5h = 1h cours + 0,5h TD', 20, finalY);
    doc.text(`Total enseignants: ${bilanData.length - 1}`, 20, finalY + 10);

    doc.save(`bilan-enseignants-${Date.now()}.pdf`);
  };

  return (
    <div className="pdf-bilan-page">
      <div className="page-header">
        <h2>Génération PDF - Bilan Global</h2>
      </div>

      <div className="pdf-form">
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

        <div className="form-info">
          <p><strong>Formule de calcul :</strong></p>
          <p>Une séance de cours de 1,5h correspond à 1h de cours + 0,5h de TD</p>
        </div>

        <button 
          onClick={generatePDF} 
          disabled={loading || !filters.academicYear}
          className="btn-generate"
        >
          {loading ? 'Génération...' : 'Générer PDF'}
        </button>
      </div>
    </div>
  );
};

export default PDFBilan;