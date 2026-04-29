import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Personality from './pages/Personality'
import Features from './pages/Features'
import Dating from './pages/Dating'
import About from './pages/About'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/personality" element={<Personality />} />
        <Route path="/features" element={<Features />} />
        <Route path="/dating" element={<Dating />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  )
}
