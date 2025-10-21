import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/Dashboard'
import ConfigPage from './pages/ConfigPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/config" />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  )
}

export default App;