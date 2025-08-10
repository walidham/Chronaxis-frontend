import React from 'react';

const Navigation = ({ currentPage, setCurrentPage, mobileNavOpen, setMobileNavOpen, sidebarOpen, user }) => {
  const baseMenuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },

    { id: 'sessions', label: 'Sessions', icon: '🕐' },
    { id: 'teachers', label: 'Enseignants', icon: '👨‍🏫' },
    { id: 'classes', label: 'Classes', icon: '🎓' },
    { id: 'courses', label: 'Cours', icon: '📚' },
    { id: 'rooms', label: 'Salles', icon: '🏫' },
    { id: 'departments', label: 'Départements', icon: '🏢' },
    { id: 'university', label: 'Université', icon: '🏛️' },
    { id: 'academic-years', label: 'Années Universitaires', icon: '📅' },
    { id: 'grades', label: 'Grades', icon: '🏅' },

    { id: 'planning', label: 'Emplois PDF', icon: '📄' },
    { id: 'timetable-test', label: 'Test Emploi du Temps', icon: '🧪' }
  ];

  const adminMenuItems = [
    { id: 'users', label: 'Gestion des Utilisateurs', icon: '👥' }
  ];

  const menuItems = user?.role === 'admin' 
    ? [...baseMenuItems, ...adminMenuItems]
    : baseMenuItems;

  const handleNavClick = (pageId) => {
    setCurrentPage(pageId);
    setMobileNavOpen(false);
  };

  return (
    <nav className={`navigation ${mobileNavOpen ? 'open' : ''} ${!sidebarOpen ? 'collapsed' : ''}`}>
      {menuItems.map(item => (
        <button
          key={item.id}
          className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
          onClick={() => handleNavClick(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;