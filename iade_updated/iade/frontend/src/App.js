import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import KayitEkrani from './components/KayitEkrani';
import Rapor from './components/Rapor';
import AdminPanel from './components/AdminPanel';
import CopKutusu from './components/CopKutusu';
import Navbar from './components/Navbar';

function App() {
  // 1. Durumu başlatırken localStorage'ı kontrol et (F5 sonrası veri kaybını önler)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [loading, setLoading] = useState(false);

  // 2. Çıkış yapma fonksiyonu (Idle süresi dolduğunda veya manuel çıkışta)
  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    // Eğer gerekiyorsa sayfayı yenileyerek temiz bir başlangıç yap
    window.location.href = '/'; 
  }, []);

  // 3. Oturum yönetimi ve Idle Timer (Zaman aşımı) mantığı
  useEffect(() => {
    // Kullanıcı bilgisi değiştiğinde localStorage'ı senkronize et
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }

    // 5 dakikalık (300.000 ms) zamanlayıcı
    let timeoutId;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 5 dakika işlem yapılmazsa logout'u tetikle
      timeoutId = setTimeout(handleLogout, 900000);
    };

    // Dinlenecek kullanıcı etkileşimleri
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Olayları ekle
    events.forEach(event => document.addEventListener(event, resetTimer));
    
    // İlk kurulumda zamanlayıcıyı başlat
    resetTimer();

    // Bileşen kapandığında (cleanup) temizle
    return () => {
      events.forEach(event => document.removeEventListener(event, resetTimer));
      clearTimeout(timeoutId);
    };
  }, [user, handleLogout]);

  if (loading) return <div style={{padding:'2rem'}}>Yükleniyor...</div>;

  return (
    <Router>
      {!user ? (
        <Login onLogin={(u) => { setUser(u); window.location.href = '/kayit'; }} />
      ) : (
        <>
          <Navbar user={user} setUser={setUser} />
          <div style={{padding:'1.5rem', maxWidth:'1400px', margin:'0 auto'}}>
            <Routes>
              <Route path="/" element={<Navigate to="/kayit" />} />
              <Route path="/login" element={<Navigate to="/kayit" />} />
              <Route path="/kayit" element={<KayitEkrani />} />
              <Route path="/rapor" element={<Rapor user={user} />} />
              <Route path="/admin" element={<AdminPanel currentUser={user} />} />
              <Route path="/cop" element={<CopKutusu currentUser={user} />} />
            </Routes>
          </div>
        </>
      )}
    </Router>
  );
}

export default App;