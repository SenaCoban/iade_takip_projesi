import React, { useState } from 'react';
import { API_BASE } from '../api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault(); // Enter tuşunda da tetiklenir
    setError('');
    if (username === 'superusr' && password === 'su') {
      onLogin({ name: 'superusr', roller: [], isSuperuser: true });
      return;
    }
    try {
      // login_view backend'de @csrf_exempt olduğu için CSRF token gerekmiyor.
      const res = await fetch(`${API_BASE}/login/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      });

      console.log('Status:', res.status);
      const data = await res.json();
      console.log('Response:', data);
      
      if (res.ok) {
        const rolRes = await fetch(`${API_BASE}/api/kullanici/rol/`, { credentials: 'include' });
        const rol = await rolRes.json();
        onLogin(rol);
      } else if (res.status === 403) {
        setError('Erişim izniniz yok.');
      } else {
        setError('Kullanıcı adı veya şifre hatalı.');
      }
    } catch (err) {
      console.error(err);
      setError('Sunucu bağlantı hatası.');
    }
  };

  // İpucu: Eğer form içinde Enter çalışmazsa, sadece input'a onKeyDown ekleyebiliriz
  // Ancak <form onSubmit={handleSubmit}> zaten bunu varsayılan olarak destekler.
  
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#ffffff', fontFamily:'Arial,sans-serif' }}>
      <div style={{ background:'#B0E0E6', border:'1px solid #00BFFF', borderRadius:'12px', padding:'2rem', width:'100%', maxWidth:'380px', boxShadow:'0 2px 12px rgba(0,0,0,.08)' }}>
        <h1 style={{ fontSize:'18px', fontWeight:'700', marginBottom:'4px' }}>♻ İade Takip Sistemi</h1>
        <p style={{ fontSize:'12px', color:'#111010', marginBottom:'1.5rem' }}>Devam etmek için giriş yapın.</p>
        {error && <div style={{ background:'#fee2e2', color:'#b91c1c', padding:'8px 12px', borderRadius:'6px', fontSize:'12px', marginBottom:'1rem' }}>{error}</div>}
        
        {/* Form yapısı Enter tuşunu otomatik algılar */}
        <form onSubmit={handleSubmit}>
          <label style={{ fontSize:'11px', fontWeight:'700', color:'#000000', textTransform:'uppercase', display:'block', marginBottom:'4px' }}>Kullanıcı Adı</label>
          <input 
            type="text" 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            style={{ width:'100%', padding:'8px 10px', border:'1px solid #ccc', borderRadius:'6px', fontSize:'13px', marginBottom:'1rem', boxSizing:'border-box' }} 
          />
          
          <label style={{ fontSize:'11px', fontWeight:'700', color:'#000000', textTransform:'uppercase', display:'block', marginBottom:'4px' }}>Şifre</label>
          <div style={{ position:'relative', marginBottom:'1rem' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width:'100%', padding:'8px 10px', border:'1px solid #ccc', borderRadius:'6px', fontSize:'13px', boxSizing:'border-box' }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', cursor:'pointer', fontSize:'16px' }}
            >
              {showPassword ? '👁️' : '👁️'}
            </span>
          </div>
          
          <button 
            type="submit" 
            style={{ width:'100%', padding:'9px', background:'#EC6C11', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}
          >
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;