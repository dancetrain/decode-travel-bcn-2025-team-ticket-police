import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button } from './Button';
export function Navigation() {
  const navigate = useNavigate();
  const {
    currentUser,
    setCurrentUser,
    suppliers,
    distributors
  } = useApp();
  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/');
  };
  const getUserName = () => {
    if (!currentUser) return '';
    if (currentUser.role === 'supplier') {
      return suppliers.find(s => s.id === currentUser.id)?.name || '';
    }
    return distributors.find(d => d.id === currentUser.id)?.name || '';
  };
  return <nav className="bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-xl font-semibold text-neutral-900">
            TicketHub
          </button>

          {currentUser && <div className="flex items-center gap-6">
              <span className="text-sm text-neutral-600">
                {getUserName()} ({currentUser.role})
              </span>
              <Button variant="secondary" onClick={handleLogout}>
                Logout
              </Button>
            </div>}
        </div>
      </div>
    </nav>;
}