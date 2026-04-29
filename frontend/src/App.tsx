import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import OnboardingPage from '@/pages/OnboardingPage'
import HomePage from '@/pages/HomePage'
import DiscoverPage from '@/pages/DiscoverPage'
import ChatPage from '@/pages/ChatPage'
import ChatRoomPage from '@/pages/ChatRoomPage'
import FeedPage from '@/pages/FeedPage'
import ProfilePage from '@/pages/ProfilePage'
import ClonePage from '@/pages/ClonePage'
import CalibrationPage from '@/pages/CalibrationPage'

function App() {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Routes>
        <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to="/home" />} />
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/home" />} />
        <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/home" />} />
        <Route path="/onboarding" element={isAuthenticated && user?.status === 'distilling' ? <OnboardingPage /> : <Navigate to="/home" />} />
        <Route path="/home" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/discover" element={isAuthenticated ? <DiscoverPage /> : <Navigate to="/login" />} />
        <Route path="/chat" element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" />} />
        <Route path="/chat/:conversationId" element={isAuthenticated ? <ChatRoomPage /> : <Navigate to="/login" />} />
        <Route path="/feed" element={isAuthenticated ? <FeedPage /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/clone" element={isAuthenticated ? <ClonePage /> : <Navigate to="/login" />} />
        <Route path="/calibrate" element={isAuthenticated ? <CalibrationPage /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  )
}

export default App
