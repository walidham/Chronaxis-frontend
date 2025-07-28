import React from 'react';

const Navigation = ({ currentPage, setCurrentPage, mobileNavOpen, setMobileNavOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
    { id: 'schedule', label: 'Planning', icon: '📅' },
    { id: 'sessions', label: 'Sessions', icon: '🕐' },
    { id: 'teachers', label: 'Enseignants', icon: '👨‍🏫' },
    { id: 'classes', label: 'Classes', icon: '🎓' },
    { id: 'courses', label: 'Cours', icon: '📚' },
    { id: 'rooms', label: 'Salles', icon: '🏫' },
    { id: 'departments', label: 'Départements', icon: '🏢' },
    { id: 'university', label: 'Université', icon: '🏛️' },
    { id: 'academic-years', label: 'Années Universitaires', icon: '📅' },
    { id: 'grades', label: 'Grades', icon: '🏅' }
  ];

  const handleNavClick = (pageId) => {
    setCurrentPage(pageId);
    setMobileNavOpen(false);
  };

  return (
    <nav className={`navigation ${mobileNavOpen ? 'open' : ''}`}>
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