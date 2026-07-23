import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { DownloadPage } from './pages/DownloadPage';
import { InstallGuidePage } from './pages/InstallGuidePage';
import { CheckInstallPage } from './pages/CheckInstallPage';
import { FAQPage } from './pages/FAQPage';

function App() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/install" element={<InstallGuidePage />} />
          <Route path="/check" element={<CheckInstallPage />} />
          <Route path="/faq" element={<FAQPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
