import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import ScheduleGrid from './components/ScheduleGrid';
import University from './components/University';
import Departments from './components/Departments';
import Teachers from './components/Teachers';
import Rooms from './components/Rooms';
import AcademicYears from './components/AcademicYears';
import Classes from './components/Classes';
import Sessions from './components/Sessions';
import Grades from './components/Grades';
import Courses from './components/Courses';
import Planning from './components/Planning';
import TimetableTest from './components/TimetableTest';
import Tracks from './components/Tracks';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';
import Users from './components/Users';
import NotificationContainer from './components/NotificationContainer';
import { NotificationProvider, useNotificationContext } from './contexts/NotificationContext';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const { notifications, removeNotification } = useNotificationContext();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setCurrentPage('dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'schedule':
        return <ScheduleGrid />;
      case 'planning':
        return <Planning />;
      case 'sessions':
        return <Sessions />;
      case 'teachers':
        return <Teachers />;
      case 'classes':
        return <Classes />;
      case 'courses':
        return <Courses />;
      case 'rooms':
        return <Rooms />;
      case 'departments':
        return <Departments />;
      case 'university':
        return <University />;
      case 'academic-years':
        return <AcademicYears />;
      case 'grades':
        return <Grades />;
      case 'tracks':
        return <Tracks />;
      case 'timetable-test':
        return <TimetableTest />;
      case 'users':
        return <Users />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <button 
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? 'Masquer le menu' : 'Afficher le menu'}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
        <h1>Chronaxis</h1>
        <div className="user-info">
          <span>Bonjour, {user.firstName} {user.lastName}</span>
          <button onClick={() => setShowChangePassword(true)} className="btn-change-password">
            Changer mot de passe
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Déconnexion
          </button>
        </div>
      </header>
      <div className={`App-body ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <button 
          className="mobile-nav-toggle"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
        >
          ☰
        </button>
        <Navigation 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          mobileNavOpen={mobileNavOpen}
          setMobileNavOpen={setMobileNavOpen}
          sidebarOpen={sidebarOpen}
          user={user}
        />
        <main className="App-main">
          {renderPage()}
        </main>
      </div>
      {showChangePassword && (
        <ChangePassword onClose={() => setShowChangePassword(false)} />
      )}
      <NotificationContainer 
        notifications={notifications} 
        removeNotification={removeNotification} 
      />
    </div>
  );
}

export default App;
