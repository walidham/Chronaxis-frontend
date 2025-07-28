import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ScheduleGrid = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSemester, setSelectedSemester] = useState(1);

  const timeSlots = [
    '8h30-10h00',
    '10h15-11h45', 
    '12h00-13h30',
    '14h30-16h00',
    '16h15-17h45',
    '16h50-18h20'
  ];

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  useEffect(() => {
    fetchSessions();
  }, [selectedClass, selectedSemester]);

  const fetchSessions = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedClass) params.append('class', selectedClass);
      if (selectedSemester) params.append('semester', selectedSemester);
      
      const response = await axios.get(`/api/sessions?${params}`);
      setSessions(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error);
    }
  };

  const getSessionForSlot = (dayIndex, timeSlotIndex) => {
    return sessions.find(session => 
      session.dayOfWeek === dayIndex + 1 && 
      session.timeSlot === timeSlotIndex + 1
    );
  };

  return (
    <div className="schedule-grid">
      <div className="schedule-filters">
        <select 
          value={selectedSemester} 
          onChange={(e) => setSelectedSemester(e.target.value)}
        >
          {[1,2,3,4,5].map(sem => (
            <option key={sem} value={sem}>Semestre {sem}</option>
          ))}
        </select>
      </div>
      
      <div className="grid-container">
        <div className="grid-header">
          <div className="time-header">Horaire</div>
          {days.map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
        </div>
        
        {timeSlots.map((timeSlot, timeIndex) => (
          <div key={timeIndex} className="grid-row">
            <div className="time-cell">{timeSlot}</div>
            {days.map((day, dayIndex) => {
              const session = getSessionForSlot(dayIndex, timeIndex);
              return (
                <div key={`${dayIndex}-${timeIndex}`} className="session-cell">
                  {session && (
                    <div className={`session-card ${session.type.toLowerCase()}`}>
                      <div className="session-course">{session.course?.name}</div>
                      <div className="session-teacher">{session.teacher?.name}</div>
                      <div className="session-room">{session.room?.name}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleGrid;