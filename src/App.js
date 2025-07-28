import React, { useState } from 'react';
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

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'schedule':
        return <ScheduleGrid />;
      case 'sessions':
        return <Sessions />;
      case 'teachers':
        return <Teachers />;
      case 'classes':
        return <Classes />;
      case 'courses':
        return <div>Gestion des Cours (à implémenter)</div>;
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
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Application de Planification</h1>
      </header>
      <div className="App-body">
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
        />
        <main className="App-main">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
