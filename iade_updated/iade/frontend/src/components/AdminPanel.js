import React, { useState, useEffect } from 'react';
import { kullanicilariGetir, kullanicilariKaydet, kullaniciSil, kayitEkle } from '../api';

const ROLLER = ['Admin', 'Kalite', 'Kalite - Proje (SOP)', 'Üretim - Kalite', 'Planlama', 'Planlama (Sevkiyat Depo)', 'Üretim', 'Üretim / Planlama', 'Okuma'];
const ADMINS = ['Beytullah Efe', 'Haydar Özzeybek', 'İsmail Cem Çelikel', 'Fatma Betül Civan', 'handenur.atci', 'Sena Çoban'];

const isSuperuser = (u) => u?.isSuperuser === true;
const isAdmin = (u) => isSuperuser(u) || ADMINS.includes(u?.name);

export default function AdminPanel({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [uyari, setUyari] = useState('');
  const [onay, setOnay] = useState(null);

  useEffect(() => { 
    load(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    if (currentUser && !isAdmin(currentUser)) return;
    try {
      const res = await kullanicilariGetir();
      setUsers(res.data.map(u => ({ 
        id: u.id, 
        name: u.kullanici_adi, 
        roller: u.roller ? u.roller.split(',').filter(Boolean) : [], 
        showDropdown: false, 
        aktif: u.aktif !== false
      })));
    } catch (err) { 
      console.error("Kullanıcılar yüklenemedi:", err); 
    }
  };

  const save = async () => {
    try {
      const payload = { kullanicilar: users.map(u => ({ id: u.id, kullanici_adi: u.name, roller: u.roller.join(','),aktif: u.aktif })) };
      await kullanicilariKaydet(payload);
      setUyari('✅ Değişiklikler başarıyla kaydedildi.');
      load();
    } catch (err) { setUyari('❌ Bu kullanıcı adı zaten kayıtlı veya geçersiz bilgi girdiniz.'); }
  };

  const addRow = () => setUsers(u => [...u, { id: null, name: '', roller: [], showDropdown: false }]);
  
  const toggleSelect = (idx) => {
    setSelected(s => {
      const ns = new Set(s);
      ns.has(idx) ? ns.delete(idx) : ns.add(idx);
      return ns;
    });
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    setOnay({ mesaj: '⚠️ Seçilen kullanıcılar silinsin mi?', islem: async () => { const toDelete = users.filter((_, i) => selected.has(i)).filter(u => u.id); try { await Promise.all(toDelete.map(u => kullaniciSil(u.id))); setUsers(u => u.filter((_, i) => !selected.has(i))); setSelected(new Set()); } catch (err) { setUyari('❌ Silme işlemi başarısız: ' + err.message); } } }); return;
    
    /*const toDelete = users.filter((_, i) => selected.has(i)).filter(u => u.id);
    
    try {
      // Mevcut kayitEkle fonksiyonunu loglama için kullanıyoruz
      /*await Promise.all(toDelete.map(u => kayitEkle({
        islem: 'Kullanıcı Silindi',
        detay: `Kullanıcı: ${u.name}`,
        yapan: currentUser?.name || 'Bilinmeyen'
      })));
      
      await Promise.all(toDelete.map(u => kullaniciSil(u.id)));
      
      setUsers(u => u.filter((_, i) => !selected.has(i)));
      setSelected(new Set());
    } catch (err) { setUyari('❌ Silme işlemi başarısız: ' + err.message); }*/
  };

  const toggleDropdown = (idx) => {
    setUsers(prev => prev.map((u, i) => i === idx ? { ...u, showDropdown: !u.showDropdown } : { ...u, showDropdown: false }));
  };

  const updateName = (idx, val) => setUsers(u => u.map((x, i) => i === idx ? { ...x, name: val } : x));

  if (currentUser && !isAdmin(currentUser)) {
    return <div style={{ padding: '2rem', color: '#dc2626' }}>Bu sayfaya erişim yetkiniz yok.</div>;
  }

  return (
    <div style={{ padding: '1rem', fontFamily: 'Segoe UI' }}>
      {uyari && <div onClick={()=>setUyari('')} style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}><div style={{background:'#fff',borderRadius:'10px',padding:'1.5rem',maxWidth:'320px',textAlign:'center'}}><p style={{fontSize:'13px',marginBottom:'1rem'}}>{uyari}</p><button onClick={()=>setUyari('')} style={{padding:'6px 16px',borderRadius:'6px',border:'1px solid #ccc',background:'#f97316',color:'#fff',cursor:'pointer',fontSize:'12px',fontWeight:'700'}}>Tamam</button></div></div>}
      {onay && <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}><div style={{background:'#fff',borderRadius:'10px',padding:'1.5rem',maxWidth:'320px',textAlign:'center'}}><p style={{fontSize:'13px',marginBottom:'1rem'}}>{onay.mesaj}</p><div style={{display:'flex',gap:'8px',justifyContent:'center'}}><button onClick={()=>{onay.islem();setOnay(null);}} style={{padding:'6px 16px',borderRadius:'6px',border:'1px solid #f97316',background:'#f97316',color:'#fff',cursor:'pointer',fontSize:'12px',fontWeight:'700'}}>Tamam</button><button onClick={()=>setOnay(null)} style={{padding:'6px 16px',borderRadius:'6px',border:'1px solid #ccc',background:'#fff',cursor:'pointer',fontSize:'12px',fontWeight:'700'}}>İptal</button></div></div></div>}
      <h1 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '1rem' }}>⚙ Admin Paneli</h1>
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px' }}>
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
            <button onClick={addRow} style={{ padding: '5px 12px', fontSize: '11px', borderRadius: '5px', border: '1px solid #ccc' }}>+ Satır Ekle</button>
            <button onClick={save} style={{ padding: '5px 12px', fontSize: '11px', borderRadius: '5px', border: 'none', background: '#EC6C11', color: '#ffffff' }}>💾 Kaydet</button>
            <button onClick={deleteSelected} style={{ padding: '5px 12px', fontSize: '11px', borderRadius: '5px', border: '1px solid #dc2626', color: '#dc2626', background: '#fff' }}>🗑 Seçilenleri Sil</button>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>#</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Kullanıcı Adı</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Rol(ler)</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Aktif</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '6px' }}><input type="checkbox" checked={selected.has(idx)} onChange={() => toggleSelect(idx)} /></td>
                  <td style={{ padding: '6px' }}>
                    <input value={u.name} onChange={e => updateName(idx, e.target.value)} style={{ width: '90%', padding: '4px', border: '1px solid #ccc' }} />
                  </td>
                  <td style={{ padding: '6px', position: 'relative' }}>
                    <div onClick={() => toggleDropdown(idx)} style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                      {u.roller.length > 0 ? u.roller.join(', ') : <span style={{ color: '#aaa' }}>Rol seçiniz...</span>}
                    </div>
                    {u.showDropdown && (
                      <div style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #ddd', marginTop: '5px', width: '250px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                        {ROLLER.map(rol => (
                          <div key={rol} 
                            onClick={() => {
                              const yeni = u.roller.includes(rol) ? u.roller.filter(r => r !== rol) : [...u.roller, rol];
                              setUsers(uu => uu.map((x, i) => i === idx ? { ...x, roller: yeni } : x));
                              toggleDropdown(idx);
                            }} 
                            style={{ padding: '8px', cursor: 'pointer', background: u.roller.includes(rol) ? '#e0f2fe' : '#fff' }}>
                            {u.roller.includes(rol) ? '✅' : '⬜'} {rol}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '6px' }}>
                    <input type="checkbox" checked={u.aktif} onChange={() => setUsers(uu => uu.map((x,i) => i===idx ? {...x, aktif: !x.aktif} : x))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}