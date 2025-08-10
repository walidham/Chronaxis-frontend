import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Planning.css';

const Planning = () => {
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [university, setUniversity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    department: '',
    academicYear: '',
    semester: 1
  });
  const [templates, setTemplates] = useState({
    classes: null,
    teachers: null,
    rooms: null
  });

  const timeSlots = [
    '8h30-10h00', '10h10-11h40', '11h50-13h20',
    '13h30-15h00', '15h10-16h40', '16h50-18h20'
  ];
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  useEffect(() => {
    fetchData();
    loadTemplates();
  }, []);

  const fetchData = async () => {
    try {
      const [departmentsRes, academicYearsRes, teachersRes, roomsRes, universityRes] = await Promise.all([
        axios.get('/api/departments'),
        axios.get('/api/academic-years'),
        axios.get('/api/teachers'),
        axios.get('/api/rooms'),
        axios.get('/api/university')
      ]);
      
      setDepartments(departmentsRes.data);
      setAcademicYears(academicYearsRes.data);
      setTeachers(teachersRes.data);
      setRooms(roomsRes.data);
      setUniversity(universityRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const templateFiles = {
        classes: '/modle_classe.dot',
        teachers: '/model_teacher.dot',
        rooms: '/model_room.dot'
      };

      for (const [type, path] of Object.entries(templateFiles)) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            const content = await response.text();
            setTemplates(prev => ({ ...prev, [type]: content }));
            console.log(`Template ${type} chargé avec succès`);
          }
        } catch (error) {
          console.log(`Template ${type} non trouvé, utilisation du format par défaut`);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
    }
  };

  const fetchClasses = async () => {
    if (filters.department && filters.academicYear) {
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
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [filters.department, filters.academicYear]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: name === 'semester' ? Number(value) : value
    });
  };

  const fetchSessionsForClass = async (classId) => {
    try {
      const response = await axios.get(`/api/sessions?class=${classId}&semester=${filters.semester}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error);
      return [];
    }
  };

  const fetchSessionsForTeacher = async (teacherId) => {
    try {
      const response = await axios.get(`/api/sessions?teacher=${teacherId}&semester=${filters.semester}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error);
      return [];
    }
  };

  const fetchSessionsForRoom = async (roomId) => {
    try {
      const response = await axios.get(`/api/sessions?room=${roomId}&semester=${filters.semester}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error);
      return [];
    }
  };

  const generateHeader = (pdf, item, type) => {
    // Utiliser le template si disponible
    const templateKey = type === 'class' ? 'classes' : type === 'teacher' ? 'teachers' : 'rooms';
    const template = templates[templateKey];
    
    if (template) {
      // Traiter le template avec les variables
      const academicYear = academicYears.find(y => y._id === filters.academicYear);
      const department = departments.find(d => d._id === filters.department);
      const universityLocation = university?.name?.split(' ').pop() || 'GAFSA';
      
      let processedTemplate = template
        .replace(/{{CLASS_NAME}}/g, item.name || '')
        .replace(/{{DEPARTMENT_NAME}}/g, department?.name || '')
        .replace(/{{TEACHER_NAME}}/g, `${item.firstName || ''} ${item.lastName || ''}`.trim())
        .replace(/{{TEACHER_GRADE}}/g, item.grade?.name || '')
        .replace(/{{ROOM_NAME}}/g, item.name || '')
        .replace(/{{ROOM_CAPACITY}}/g, item.capacity || '')
        .replace(/{{SEMESTER}}/g, filters.semester)
        .replace(/{{ACADEMIC_YEAR}}/g, academicYear?.name || '')
        .replace(/{{DEPARTMENT_HEAD}}/g, department?.head || '')
        .replace(/{{STUDIES_DIRECTOR}}/g, university?.studiesDirectorName || '')
        .replace(/{{ISET_DIRECTOR}}/g, university?.directorName || '')
        .replace(/DE GAFSA/g, `DE ${universityLocation.toUpperCase()}`);
      
      // Afficher le template (version simplifiée)
      const lines = processedTemplate.split('\n').filter(line => 
        line.trim() && !line.includes('[TABLE_PLACEHOLDER]') && !line.includes('Code ISO')
      );
      
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(7);
      
      lines.forEach((line, index) => {
        if (line.includes('EMPLOI DU TEMPS')) {
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
        } else if (line.includes('Classe:') || line.includes('Enseignant:') || line.includes('Salle:')) {
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'normal');
        } else {
          pdf.setFontSize(7);
          pdf.setFont(undefined, 'bold');
        }
        
        const textWidth = pdf.getTextWidth(line.trim());
        let yPos = 10 + (index * 3);
        
        // Ajouter espace supplémentaire avant "EMPLOI DU TEMPS"
        if (line.includes('EMPLOI DU TEMPS')) {
          yPos += 3;
        }
        // Ajouter espace supplémentaire après "EMPLOI DU TEMPS" pour les informations
        if (line.includes(':') && index > 0) {
          yPos += 6;
        }
        
        if (line.includes('EMPLOI DU TEMPS')) {
          pdf.text(line.trim(), (297 - textWidth) / 2, yPos);
          // Pas de ligne de séparation pour économiser l'espace
        } else if (line.includes(':')) {
          // Centrer les informations classe/département/semestre sous "EMPLOI DU TEMPS"
          pdf.text(line.trim(), (297 - textWidth) / 2, yPos);
        } else {
          pdf.text(line.trim(), (297 - textWidth) / 2, yPos);
        }
      });
    } else {
      // Format par défaut si pas de template
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(7);
      
      let text = 'RÉPUBLIQUE TUNISIENNE';
      let textWidth = pdf.getTextWidth(text);
      pdf.text(text, (297 - textWidth) / 2, 15);
      
      // ... reste du code par défaut
    }
  };

  const generateTable = (pdf, sessions) => {
    const tableData = [];
    
    timeSlots.forEach((timeSlot, timeIndex) => {
      const row = [timeSlot];
      days.forEach((day, dayIndex) => {
        const sessionsForSlot = sessions.filter(s => 
          s.dayOfWeek === dayIndex + 1 && s.timeSlot === timeIndex + 1
        );
        
        if (sessionsForSlot.length > 0) {
          // Pour les cellules avec sessions, on utilise un format spécial
          row.push({ content: '', sessions: sessionsForSlot });
        } else {
          row.push('');
        }
      });
      tableData.push(row);
    });

    autoTable(pdf, {
      head: [['Horaires', ...days]],
      body: tableData,
      startY: 40,
      margin: { left: 15, right: 15 },
      styles: { 
        fontSize: 8, 
        cellPadding: 4,
        halign: 'center',
        valign: 'middle',
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        minCellHeight: 20
      },
      headStyles: { 
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 8,
        fontStyle: 'bold',
        lineWidth: 1,
        minCellHeight: 12
      },
      columnStyles: { 
        0: { 
          cellWidth: 25, 
          fillColor: [240, 240, 240],
          fontStyle: 'bold'
        },
        1: { cellWidth: 40.25 },
        2: { cellWidth: 40.25 },
        3: { cellWidth: 40.25 },
        4: { cellWidth: 40.25 },
        5: { cellWidth: 40.25 },
        6: { cellWidth: 40.25 }
      },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 1,
      didDrawCell: function(data) {
        // Dessiner le contenu personnalisé des cellules
        if (data.cell.raw && data.cell.raw.sessions) {
          const sessions = data.cell.raw.sessions;
          const cellX = data.cell.x;
          const cellY = data.cell.y;
          const cellWidth = data.cell.width;
          const cellHeight = data.cell.height;
          
          sessions.forEach((session, index) => {
            const sessionHeight = cellHeight / sessions.length;
            const yOffset = index * sessionHeight;
            
            // Trait horizontal de séparation entre sessions (sauf pour la première et pas dans la dernière colonne)
            if (index > 0 && data.column.index < 6) {
              pdf.setLineWidth(0.3);
              pdf.line(cellX, cellY + yOffset, cellX + cellWidth, cellY + yOffset);
            }
            
            if (sessions.length > 1) {
              // Pour les cellules avec plusieurs sessions
              
              // Nom de l'enseignant en bas à gauche
              if (session.teacher) {
                pdf.setFontSize(6);
                pdf.setFont(undefined, 'normal');
                pdf.text(
                  `${session.teacher.firstName} ${session.teacher.lastName}`,
                  cellX + 1,
                  cellY + yOffset + sessionHeight - 2
                );
              }
              
              // Nom du groupe en haut à droite (format G1/G2)
              let groupText = '';
              if (session.groups && session.groups.length > 0) {
                groupText = session.groups.map(g => (g.name || g).replace('Groupe ', 'G')).join('/');
              } else if (session.group) {
                groupText = session.group.replace('Groupe ', 'G');
              } else if (session.groupName) {
                groupText = session.groupName.replace('Groupe ', 'G');
              }
              
              if (groupText) {
                pdf.setFontSize(6);
                pdf.setFont(undefined, 'normal');
                const groupWidth = pdf.getTextWidth(groupText);
                pdf.text(
                  groupText,
                  cellX + cellWidth - groupWidth - 1,
                  cellY + yOffset + 6
                );
              }
              
            } else {
              // Pour les cellules avec une seule session (format original)
              
              // Nom de l'enseignant en haut à gauche
              if (session.teacher) {
                pdf.setFontSize(6);
                pdf.setFont(undefined, 'normal');
                pdf.text(
                  `${session.teacher.firstName} ${session.teacher.lastName}`,
                  cellX + 1,
                  cellY + yOffset + 5
                );
              }
              
              // Groupes si présents (format original)
              let groupsText = '';
              if (session.groups && session.groups.length > 0) {
                groupsText = session.groups.map(g => (g.name || g).replace('Groupe ', 'G')).join('/');
              } else if (session.group) {
                groupsText = session.group.replace('Groupe ', 'G');
              } else if (session.groupName) {
                groupsText = session.groupName.replace('Groupe ', 'G');
              }
              
              if (groupsText) {
                pdf.setFontSize(5);
                pdf.setFont(undefined, 'normal');
                const groupsWidth = pdf.getTextWidth(groupsText);
                pdf.text(
                  groupsText,
                  cellX + (cellWidth - groupsWidth) / 2,
                  cellY + yOffset + sessionHeight - 2
                );
              }
            }
            
            // Code du cours au centre (pour tous les cas)
            if (session.course) {
              pdf.setFontSize(8);
              pdf.setFont(undefined, 'bold');
              const courseText = session.course.code;
              const courseWidth = pdf.getTextWidth(courseText);
              pdf.text(
                courseText,
                cellX + (cellWidth - courseWidth) / 2,
                cellY + yOffset + sessionHeight / 2 + 1
              );
            }
            
            // Salle en bas à droite (pour tous les cas)
            if (session.room) {
              pdf.setFontSize(6);
              pdf.setFont(undefined, 'normal');
              const roomText = session.room.name;
              const roomWidth = pdf.getTextWidth(roomText);
              pdf.text(
                roomText,
                cellX + cellWidth - roomWidth - 1,
                cellY + yOffset + sessionHeight - 2
              );
            }
          });
        }
      }
    });
  };

  const generateFooter = (pdf) => {
    const pageHeight = pdf.internal.pageSize.height;
    const footerY = pageHeight - 25; // Rapproché du tableau
    

    
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'bold');
    
    // Cadres plus petits
    pdf.rect(15, footerY, 75, 20);
    pdf.rect(105, footerY, 75, 20);
    pdf.rect(195, footerY, 75, 20);
    
    // Titres
    pdf.text('Directeur de Département', 18, footerY + 6);
    pdf.text('Directeur des Études', 108, footerY + 6);
    pdf.text('Directeur de l\'ISET', 198, footerY + 6);
    
    // Noms
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(7);
    const department = departments.find(d => d._id === filters.department);
    pdf.text(department?.head || '', 18, footerY + 15);
    pdf.text(university?.studiesDirectorName || '', 108, footerY + 15);
    pdf.text(university?.directorName || '', 198, footerY + 15);
    
    // Code ISO en bas à droite
    pdf.setFontSize(6);
    pdf.text('Code ISO: FQ-PED-06 (DTI)/REV00', 200, pageHeight - 5);
  };

  const generateClassPDF = async (classItem) => {
    const sessions = await fetchSessionsForClass(classItem._id);
    const pdf = new jsPDF('l', 'mm', 'a4');
    
    generateHeader(pdf, classItem, 'class');
    generateTable(pdf, sessions);
    generateFooter(pdf);

    pdf.save(`Emploi_du_temps_${classItem.name}.pdf`);
  };

  const generateAllClassesPDF = async () => {
    if (classes.length === 0) {
      alert('Aucune classe disponible.');
      return;
    }

    const pdf = new jsPDF('l', 'mm', 'a4');
    
    for (let i = 0; i < classes.length; i++) {
      const classItem = classes[i];
      const sessions = await fetchSessionsForClass(classItem._id);
      
      if (i > 0) pdf.addPage();
      
      generateHeader(pdf, classItem, 'class');
      generateTable(pdf, sessions);
      generateFooter(pdf);
    }

    const department = departments.find(d => d._id === filters.department);
    const academicYear = academicYears.find(y => y._id === filters.academicYear);
    pdf.save(`Emplois_du_temps_classes_${department?.name || 'Dept'}_${academicYear?.name || 'Annee'}_S${filters.semester}.pdf`);
  };

  const calculateTeacherStats = (sessions) => {
    let lectureHours = 0;
    let tutorialHours = 0;
    let practicalHours = 0;
    
    sessions.forEach(session => {
      switch (session.type) {
        case 'LECTURE':
          lectureHours += 1.5; // 1h cours + 0.5h TD
          break;
        case 'TUTORIAL':
          tutorialHours += 1.5;
          break;
        case 'PRACTICAL':
          practicalHours += 1.5;
          break;
      }
    });
    
    const totalHours = lectureHours + tutorialHours + practicalHours;
    const courseHours = sessions.filter(s => s.type === 'LECTURE').length;
    const tdHours = tutorialHours + (sessions.filter(s => s.type === 'LECTURE').length * 0.5);
    const tpHours = practicalHours;
    
    return {
      total: totalHours,
      courses: courseHours,
      td: tdHours,
      tp: tpHours
    };
  };

  const generateTeacherPDF = async (teacher) => {
    const allSessions = await axios.get(`/api/sessions?semester=${filters.semester}`);
    const teacherSessions = allSessions.data.filter(session => 
      session.teacher && session.teacher._id === teacher._id
    );
    const pdf = new jsPDF('l', 'mm', 'a4');
    
    generateHeader(pdf, teacher, 'teacher');
    
    // Ajouter les statistiques d'heures
    const stats = calculateTeacherStats(teacherSessions);
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    const statsText = `Total : ${stats.total}h, Cours : ${stats.courses}, TD: ${stats.td}h, TP: ${stats.tp}h`;
    pdf.text(statsText, 15, 37);
    
    generateTable(pdf, teacherSessions);
    generateFooter(pdf);

    pdf.save(`Emploi_du_temps_${teacher.firstName}_${teacher.lastName}.pdf`);
  };

  const generateAllTeachersPDF = async () => {
    if (teachers.length === 0) {
      alert('Aucun enseignant disponible.');
      return;
    }

    const pdf = new jsPDF('l', 'mm', 'a4');
    const allSessions = await axios.get(`/api/sessions?semester=${filters.semester}`);
    
    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i];
      const teacherSessions = allSessions.data.filter(session => 
        session.teacher && session.teacher._id === teacher._id
      );
      
      if (i > 0) pdf.addPage();
      
      generateHeader(pdf, teacher, 'teacher');
      
      // Ajouter les statistiques d'heures
      const stats = calculateTeacherStats(teacherSessions);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      const statsText = `Total : ${stats.total}h, Cours : ${stats.courses}, TD: ${stats.td}h, TP: ${stats.tp}h`;
      pdf.text(statsText, 15, 37);
      
      generateTable(pdf, teacherSessions);
      generateFooter(pdf);
    }

    const department = departments.find(d => d._id === filters.department);
    const academicYear = academicYears.find(y => y._id === filters.academicYear);
    pdf.save(`Emplois_du_temps_enseignants_${department?.name || 'Dept'}_${academicYear?.name || 'Annee'}_S${filters.semester}.pdf`);
  };

  const generateRoomPDF = async (room) => {
    const allSessions = await axios.get(`/api/sessions?semester=${filters.semester}`);
    const roomSessions = allSessions.data.filter(session => 
      session.room && session.room._id === room._id
    );
    const pdf = new jsPDF('l', 'mm', 'a4');
    
    generateHeader(pdf, room, 'room');
    generateTable(pdf, roomSessions);
    generateFooter(pdf);

    pdf.save(`Emploi_du_temps_salle_${room.name}.pdf`);
  };

  const generateAllRoomsPDF = async () => {
    if (rooms.length === 0) {
      alert('Aucune salle disponible.');
      return;
    }

    const pdf = new jsPDF('l', 'mm', 'a4');
    const allSessions = await axios.get(`/api/sessions?semester=${filters.semester}`);
    
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      const roomSessions = allSessions.data.filter(session => 
        session.room && session.room._id === room._id
      );
      
      if (i > 0) pdf.addPage();
      
      generateHeader(pdf, room, 'room');
      generateTable(pdf, roomSessions);
      generateFooter(pdf);
    }

    const department = departments.find(d => d._id === filters.department);
    const academicYear = academicYears.find(y => y._id === filters.academicYear);
    pdf.save(`Emplois_du_temps_salles_${department?.name || 'Dept'}_${academicYear?.name || 'Annee'}_S${filters.semester}.pdf`);
  };

  const isFilterComplete = filters.department && filters.academicYear && filters.semester;

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="planning-page">
      <div className="page-header">
        <h2>Génération des Emplois du Temps PDF</h2>
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

      {!isFilterComplete && (
        <div className="warning-message">
          <p>⚠️ Veuillez sélectionner le département, l'année universitaire et le semestre pour générer les emplois du temps.</p>
        </div>
      )}

      {isFilterComplete && (
        <div className="planning-sections">
          <div className="planning-section">
            <div className="section-header">
              <h3>📚 Emplois du temps des Classes</h3>
              <button 
                onClick={generateAllClassesPDF}
                className="btn-all-pdf"
              >
                📁 Toutes les classes
              </button>
            </div>
            <div className="items-grid">
              {classes.map(cls => (
                <div key={cls._id} className="planning-item">
                  <span>{cls.name}</span>
                  <button 
                    onClick={() => generateClassPDF(cls)}
                    className="btn-pdf"
                  >
                    📄 PDF
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="planning-section">
            <div className="section-header">
              <h3>👨‍🏫 Emplois du temps des Enseignants</h3>
              <button 
                onClick={generateAllTeachersPDF}
                className="btn-all-pdf"
              >
                📁 Tous les enseignants
              </button>
            </div>
            <div className="items-grid">
              {teachers.map(teacher => (
                <div key={teacher._id} className="planning-item">
                  <span>{teacher.firstName} {teacher.lastName}</span>
                  <button 
                    onClick={() => generateTeacherPDF(teacher)}
                    className="btn-pdf"
                  >
                    📄 PDF
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="planning-section">
            <div className="section-header">
              <h3>🏢 Emplois du temps des Salles</h3>
              <button 
                onClick={generateAllRoomsPDF}
                className="btn-all-pdf"
              >
                📁 Toutes les salles
              </button>
            </div>
            <div className="items-grid">
              {rooms.map(room => (
                <div key={room._id} className="planning-item">
                  <span>{room.name}</span>
                  <button 
                    onClick={() => generateRoomPDF(room)}
                    className="btn-pdf"
                  >
                    📄 PDF
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planning;