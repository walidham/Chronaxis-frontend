import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './PDFPages.css';

const PDFEmplois = () => {
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [currentPdf, setCurrentPdf] = useState(null);
  
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
      const pdf = await createPDF(sessions);
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setCurrentPdf(pdf);
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setLoading(false);
    }
  };

  const printPDF = () => {
    if (currentPdf) {
      const targetItem = getTargetOptions().find(item => item._id === filters.target);
      const fileName = `Emploi_du_temps_${getTargetLabel(targetItem || {})}.pdf`;
      currentPdf.save(fileName);
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

  const createPDF = async (sessions) => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Récupérer les données nécessaires pour l'en-tête
    const [universityRes, templatesData] = await Promise.all([
      axios.get('/api/university').catch(() => ({ data: null })),
      loadTemplates()
    ]);
    
    const university = universityRes.data;
    
    if (filters.target === 'all') {
      // Générer pour tous les éléments
      return await generateAllPDFs(doc, sessions, university, templatesData);
    } else {
      // Générer pour un élément spécifique
      const targetItem = await getTargetItem();
      if (targetItem) {
        return generateSinglePDF(doc, sessions, targetItem, university, templatesData);
      }
    }
    return doc;
  };

  const loadTemplates = async () => {
    try {
      const templateFiles = {
        classes: '/modle_classe.dot',
        teachers: '/model_teacher.dot', 
        rooms: '/model_room.dot'
      };
      
      const templates = {};
      for (const [type, path] of Object.entries(templateFiles)) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            templates[type] = await response.text();
          }
        } catch (error) {
          console.log(`Template ${type} non trouvé`);
        }
      }
      return templates;
    } catch (error) {
      return {};
    }
  };

  const generateHeader = (pdf, item, type, university, templates, sessions) => {
    const templateKey = type === 'classes' ? 'classes' : type === 'teachers' ? 'teachers' : 'rooms';
    const template = templates[templateKey];
    
    if (template) {
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
      
      const lines = processedTemplate.split('\n').filter(line => 
        line.trim() && !line.includes('[TABLE_PLACEHOLDER]') && !line.includes('Code ISO')
      );
      
      lines.forEach((line, index) => {
        if (line.includes('EMPLOI DU TEMPS')) {
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
        } else if (line.includes('Classe:') || line.includes('Enseignant:') || line.includes('Salle:')) {
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
        } else {
          pdf.setFontSize(7);
          pdf.setFont(undefined, 'bold');
        }
        
        const textWidth = pdf.getTextWidth(line.trim());
        let yPos = 10 + (index * 3);
        
        if (line.includes('EMPLOI DU TEMPS')) yPos += 3;
        if (line.includes(':') && index > 0) yPos += 5;
        
        pdf.text(line.trim(), (297 - textWidth) / 2, yPos);
      });
    }
    
    // Ajouter les totaux pour les enseignants
    if (type === 'teachers' && sessions.length > 0) {
      // Filtrer les sessions de l'enseignant pour le calcul
      const teacherSessions = sessions.filter(s => s.teacher?._id === item._id);
      
      // Calculer les totaux d'heures
      let totalHours = 0, coursHours = 0, tdHours = 0, tpHours = 0;
      
      teacherSessions.forEach(session => {
        if (session.type === 'LECTURE') {
          totalHours += 1.5;
          coursHours += 1;
          tdHours += 0.5;
        } else if (session.type === 'PRACTICAL') {
          totalHours += 1.5;
          tpHours += 1.5;
        } else {
          // Pour tous les autres types (TD, etc.), compter comme TD
          totalHours += 1.5;
          tdHours += 1.5;
        }
      });
      
      // Afficher les totaux à droite
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      const totalsText = `Total: ${totalHours}h, Cours: ${coursHours}h, TD: ${tdHours}h, TP: ${tpHours}h`;
      const totalsWidth = pdf.getTextWidth(totalsText);
      pdf.text(totalsText, 297 - 15 - totalsWidth, 35);
    }
  };

  const generateTable = (pdf, sessions, teacherId = null) => {
    // Filtrer les sessions par enseignant si spécifié
    const filteredSessions = teacherId ? 
      sessions.filter(s => s.teacher?._id === teacherId) : 
      sessions;
    const timeSlots = ['8h30-10h00', '10h10-11h40', '11h50-13h20', '13h30-15h00', '15h10-16h40', '16h50-18h20'];
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const tableData = [];
    
    timeSlots.forEach((timeSlot, timeIndex) => {
      const row = [timeSlot];
      days.forEach((day, dayIndex) => {
        const sessionsForSlot = filteredSessions.filter(s => 
          s.dayOfWeek === dayIndex + 1 && s.timeSlot === timeIndex + 1
        );
        
        if (sessionsForSlot.length > 0) {
          row.push({ content: '', sessions: sessionsForSlot });
        } else {
          row.push('');
        }
      });
      tableData.push(row);
    });

    pdf.autoTable({
      head: [['Horaires', ...days]],
      body: tableData,
      startY: 42,
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
        0: { cellWidth: 25, fillColor: [240, 240, 240], fontStyle: 'bold' },
        1: { cellWidth: 40.25 }, 2: { cellWidth: 40.25 }, 3: { cellWidth: 40.25 },
        4: { cellWidth: 40.25 }, 5: { cellWidth: 40.25 }, 6: { cellWidth: 40.25 }
      },
      didDrawCell: function(data) {
        if (data.cell.raw && data.cell.raw.sessions) {
          const sessions = data.cell.raw.sessions;
          const cellX = data.cell.x, cellY = data.cell.y;
          const cellWidth = data.cell.width, cellHeight = data.cell.height;
          
          sessions.forEach((session, index) => {
            const sessionHeight = cellHeight / sessions.length;
            const yOffset = index * sessionHeight;
            
            if (index > 0) {
              pdf.setLineWidth(0.3);
              pdf.line(cellX, cellY + yOffset, cellX + cellWidth, cellY + yOffset);
            }
            
            // Code de la matière en haut
            if (session.course) {
              pdf.setFontSize(7);
              pdf.setFont(undefined, 'bold');
              const courseText = session.course.code;
              const courseWidth = pdf.getTextWidth(courseText);
              pdf.text(courseText, cellX + (cellWidth - courseWidth) / 2, cellY + yOffset + 5);
            }
            
            // Affichage selon le type d'emploi du temps
            const bottomTexts = [];
            if (teacherId) {
              // Pour les emplois d'enseignants, afficher la classe + groupe
              if (session.class) {
                let classText = session.class.name;
                if (session.group && session.group.trim() !== '') {
                  const groupText = session.group.replace('Groupe ', 'G');
                  classText += ` ${groupText}`;
                }
                bottomTexts.push(classText);
              }
              if (session.room) {
                bottomTexts.push(session.room.name);
              }
            } else if (filters.type === 'rooms') {
              // Pour les emplois de salles, afficher la classe + groupe et l'enseignant
              if (session.class) {
                let classText = session.class.name;
                if (session.group && session.group.trim() !== '') {
                  const groupText = session.group.replace('Groupe ', 'G');
                  classText += ` ${groupText}`;
                }
                bottomTexts.push(classText);
              }
              if (session.teacher) {
                const teacherText = `${session.teacher.firstName.charAt(0)}.${session.teacher.lastName}`;
                bottomTexts.push(teacherText);
              }
            } else {
              // Pour les emplois de classes, afficher l'enseignant et la salle
              if (session.teacher) {
                const teacherText = `${session.teacher.firstName.charAt(0)}.${session.teacher.lastName}`;
                bottomTexts.push(teacherText);
              }
              if (session.room) {
                bottomTexts.push(session.room.name);
              }
            }
            
            if (bottomTexts.length > 0) {
              pdf.setFontSize(6);
              pdf.setFont(undefined, 'normal');
              const combinedText = bottomTexts.join(' - ');
              const textWidth = pdf.getTextWidth(combinedText);
              pdf.text(combinedText, cellX + cellWidth - textWidth - 1, cellY + yOffset + sessionHeight - 2);
            }
            

          });
        }
      }
    });
  };

  const generateFooter = (pdf, university) => {
    const pageHeight = pdf.internal.pageSize.height;
    const footerY = pageHeight - 25;
    
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'bold');
    
    pdf.rect(15, footerY, 75, 20);
    pdf.rect(105, footerY, 75, 20);
    pdf.rect(195, footerY, 75, 20);
    
    pdf.text('Directeur de Département', 18, footerY + 6);
    pdf.text('Directeur des Études', 108, footerY + 6);
    pdf.text('Directeur de l\'ISET', 198, footerY + 6);
    
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(7);
    const department = departments.find(d => d._id === filters.department);
    pdf.text(department?.head || '', 18, footerY + 15);
    pdf.text(university?.studiesDirectorName || '', 108, footerY + 15);
    pdf.text(university?.directorName || '', 198, footerY + 15);
    
    pdf.setFontSize(6);
    pdf.text('Code ISO: FQ-PED-06 (DTI)/REV00', 200, pageHeight - 5);
  };

  const generateSinglePDF = (pdf, sessions, item, university, templates) => {
    const type = filters.type === 'classes' ? 'classes' : filters.type === 'teachers' ? 'teachers' : 'rooms';
    const teacherId = type === 'teachers' ? item._id : null;
    generateHeader(pdf, item, type, university, templates, sessions);
    generateTable(pdf, sessions, teacherId);
    generateFooter(pdf, university);
    
    return pdf;
  };

  const generateAllPDFs = async (pdf, allSessions, university, templates) => {
    const targets = getTargetOptions();
    
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      let targetSessions = [];
      
      if (filters.type === 'classes') {
        targetSessions = allSessions.filter(s => s.class?._id === target._id);
      } else if (filters.type === 'teachers') {
        targetSessions = allSessions.filter(s => s.teacher?._id === target._id);
      } else if (filters.type === 'rooms') {
        targetSessions = allSessions.filter(s => s.room?._id === target._id);
      }
      
      if (i > 0) pdf.addPage();
      
      const type = filters.type === 'classes' ? 'classes' : filters.type === 'teachers' ? 'teachers' : 'rooms';
      const teacherId = type === 'teachers' ? target._id : null;
      generateHeader(pdf, target, type, university, templates, targetSessions);
      generateTable(pdf, targetSessions, teacherId);
      generateFooter(pdf, university);
    }
    
    return pdf;
  };

  const getTargetItem = async () => {
    if (filters.type === 'classes') {
      return classes.find(c => c._id === filters.target);
    } else if (filters.type === 'teachers') {
      return teachers.find(t => t._id === filters.target);
    } else if (filters.type === 'rooms') {
      return rooms.find(r => r._id === filters.target);
    }
    return null;
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
        <div className="form-row">
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
        </div>

        <div className="form-row">
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
        </div>

        <div className="pdf-buttons">
          <button 
            onClick={generatePDF} 
            disabled={loading || !filters.department || !filters.academicYear}
            className="btn-generate"
          >
            {loading ? 'Génération...' : 'Générer PDF'}
          </button>
          
          {pdfUrl && (
            <button 
              onClick={printPDF}
              className="btn-print"
            >
              Télécharger PDF
            </button>
          )}
        </div>

        {pdfUrl && (
          <div className="pdf-preview">
            <h3>Aperçu de l'emploi du temps</h3>
            <iframe 
              src={pdfUrl}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFEmplois;