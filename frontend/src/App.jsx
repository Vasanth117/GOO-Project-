import React from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import MissionsPage from './pages/MissionsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import AIPage from './pages/AIPage'
import CommunityPage from './pages/CommunityPage'
import RewardsPage from './pages/RewardsPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import MarketplacePage from './pages/MarketplacePage'
import MessagesPage from './pages/MessagesPage'
import CameraPage from './pages/CameraPage'
import FieldMapPage from './pages/FieldMapPage'
import DashboardLayout from './components/DashboardLayout'
import { PublicRoute, PrivateRoute } from './components/ProtectedRoute'
import { Construction } from 'lucide-react'
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={
        <PublicRoute><AuthPage /></PublicRoute>
      } />
      <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/missions"    element={<MissionsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/rewards"     element={<RewardsPage />} />

        <Route path="/ai"          element={<AIPage />} />
        <Route path="/map"         element={<FieldMapPage />} />
        <Route path="/community"   element={<CommunityPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/messages"    element={<MessagesPage />} />
        <Route path="/settings"    element={<SettingsPage />} />
        <Route path="/profile/:userId?" element={<ProfilePage />} />
      </Route>

      {/* 📸 FULL PAGE CAMERA (No Sidebar/Topbar) */}
      <Route path="/camera" element={<CameraPage />} />
    </Routes>
  )
}

const ComingSoon = ({ title }) => (
  <div style={{
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '100%', gap: 16, padding: 40,
    background: '#f4f7f4'
  }}>
    <Construction size={48} color="#2d5a27" />
    <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.8rem', color: '#1a1c19', margin: 0 }}>
      {title}
    </h2>
    <p style={{ color: '#888', fontSize: '1rem', margin: 0 }}>
      This page is currently under development.
    </p>
  </div>
)

export default App
