import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../api';

const styles = {
  nav: { display:'flex', gap:'8px', padding:'12px 24px', background:'#e0dede', borderBottom:'1px solid #e0e0e0', alignItems:'center' },
  btn: { padding:'7px 18px', borderRadius:'8px', border:'1px solid #ccc', background:'#fff', color:'#333', cursor:'pointer', fontWeight:'600', fontSize:'13px' },
  active: { background:'#ec6c11', color:'#fff', borderColor:'#ec6c11' },
  logout: { marginLeft:'auto', padding:'7px 18px', borderRadius:'8px', border:'1px solid #dc2626', background:'#fff', color:'#dc2626', cursor:'pointer', fontWeight:'600', fontSize:'13px', textDecoration:'none' },
  user: { fontSize:'12px', color:'#666', marginRight:'8px' }
};

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/kayit', label: '✎ Kayıt Ekranı' },
    { path: '/rapor', label: '📊 Rapor' },
    { path: '/admin', label: '⚙ Admin Paneli' },
    { path: '/cop', label: '🗑 Çöp Kutusu' },
  ];

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCookie('csrftoken'),
        },
      });
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
  };

  return (
    <div style={styles.nav}>
      {navItems.map(item => (
        <button
          key={item.path}
          style={{ ...styles.btn, ...(location.pathname === item.path ? styles.active : {}) }}
          onClick={() => navigate(item.path)}
        >
          {item.label}
        </button>
      ))}
      <div style={{marginLeft:'auto', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px'}}>
        <span style={styles.user}>👤 {user?.username || user?.name}</span>
        <button onClick={handleLogout} style={styles.logout}>⇤ Çıkış</button>
      </div>
    </div>
  );
}

export default Navbar;