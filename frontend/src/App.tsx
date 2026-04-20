import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initializeSocket } from './socket/socket';
import { Login } from './pages/Login';
import { Chat } from './pages/Chat';
import './App.css';

const AppRoutes: React.FC = () => {
  const { token, loading } = useAuth();

  useEffect(() => {
    if (token) {
      try {
        initializeSocket();
      } catch (err) {
        console.error('Socket initialization error:', err);
      }
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#c7deea] border-t-[#12617a]" />
          <p className="mt-3 text-sm font-semibold text-[#577286]">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/chat"
        element={token ? <Chat /> : <Navigate to="/login" />}
      />
      <Route path="/" element={<Navigate to={token ? '/chat' : '/login'} />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
