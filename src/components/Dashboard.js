import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalRooms: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [sessions, teachers, classes, rooms] = await Promise.all([
        axios.get('/api/sessions'),
        axios.get('/api/teachers'),
        axios.get('/api/classes'),
        axios.get('/api/rooms')
      ]);

      setStats({
        totalSessions: sessions.data.length,
        totalTeachers: teachers.data.length,
        totalClasses: classes.data.length,
        totalRooms: rooms.data.length
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  return (
    <div className="dashboard">
      <h2>Tableau de bord</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-number">{stats.totalSessions}</div>
          <div className="stat-label">Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-number">{stats.totalTeachers}</div>
          <div className="stat-label">Enseignants</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-number">{stats.totalClasses}</div>
          <div className="stat-label">Classes</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏫</div>
          <div className="stat-number">{stats.totalRooms}</div>
          <div className="stat-label">Salles</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;