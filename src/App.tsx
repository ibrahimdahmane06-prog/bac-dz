/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BottomNav } from './components/layout/BottomNav';
import { AnimatePresence, motion } from 'framer-motion';

import { SettingsProvider } from './contexts/SettingsContext';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Assistant = lazy(() => import('./pages/Assistant'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const Subject = lazy(() => import('./pages/Subject'));
const Lesson = lazy(() => import('./pages/Lesson'));
const Philosophy = lazy(() => import('./pages/Philosophy'));
const Payment = lazy(() => import('./pages/Payment'));
const Admin = lazy(() => import('./pages/Admin'));
const ExerciseSolver = lazy(() => import('./pages/ExerciseSolver'));
const Forum = lazy(() => import('./pages/Forum'));
const QuizHub = lazy(() => import('./pages/QuizHub'));
const PrivateRequest = lazy(() => import('./pages/PrivateRequest'));

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen pb-20 bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-x-hidden">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
        }>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={<ProtectedRoute><PageWrapper><Home /></PageWrapper></ProtectedRoute>} />
              <Route path="/assistant" element={<ProtectedRoute><PageWrapper><Assistant /></PageWrapper></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />
              <Route path="/subjects" element={<ProtectedRoute><PageWrapper><Home /></PageWrapper></ProtectedRoute>} />
              <Route path="/subject/:id" element={<ProtectedRoute><PageWrapper><Subject /></PageWrapper></ProtectedRoute>} />
              <Route path="/lesson/:id" element={<ProtectedRoute><PageWrapper><Lesson /></PageWrapper></ProtectedRoute>} />
              <Route path="/philosophy" element={<ProtectedRoute><PageWrapper><Philosophy /></PageWrapper></ProtectedRoute>} />
              <Route path="/payment" element={<ProtectedRoute><PageWrapper><Payment /></PageWrapper></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><PageWrapper><Admin /></PageWrapper></ProtectedRoute>} />
              <Route path="/solve" element={<ProtectedRoute><PageWrapper><ExerciseSolver /></PageWrapper></ProtectedRoute>} />
              <Route path="/forum" element={<ProtectedRoute><PageWrapper><Forum /></PageWrapper></ProtectedRoute>} />
              <Route path="/quiz-hub" element={<ProtectedRoute><PageWrapper><QuizHub /></PageWrapper></ProtectedRoute>} />
              <Route path="/private-session" element={<ProtectedRoute><PageWrapper><PrivateRequest /></PageWrapper></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </div>
      
      {user && <BottomNav />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}
