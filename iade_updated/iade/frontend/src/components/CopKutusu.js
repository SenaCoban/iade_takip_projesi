import React, { useState, useEffect } from 'react';
import { copListele, copGeriYukle, copKaliciSil, kullaniciCopListele, kullaniciCopGeriYukle, kullaniciCopKaliciSil } from '../api';

const ADMINS = ['Beytullah Efe', 'Haydar Özzeybek', 'İsmail Cem Çelikel', 'Fatma Betül Civan', 'handenur.atci', 'Sena Çoban'];
const isAdmin = (u) => u?.isSuperuser === true || (u?.roller || []).includes('Admin') || ADMINS.includes(u?.name);

export default function CopKutusu({ currentUser }) {
  const [items, setItems] = useState([]);
  const [kullanicilar, setKullanicilar] = useState([]);
  const [uyari, setUyari] = useState('');
  const [onay, setOnay] = useState(null);

  useEffect(() => { load(); }, []);

  const load = () => {
    copListele().then(res => setItems(res.data));
    kullaniciCopListele().then(res => setKullanicilar(res.data));
  };

  const geriYukle = (id) => {
   setOnay({ mesaj: '⚠️ Bu kayıt geri yüklensin mi?', islem: () => copGeriYukle(id).then(() => { setUyari('✅ Kayıt geri yüklendi.'); load(); }) });
  };

  const kaliciSil = (id) => {
    setOnay({ mesaj: '⚠️ Kalıcı olarak silinecek. Emin misiniz?', islem: () => { copKaliciSil(id).then(() => load()); } });
    copKaliciSil(id).then(() => load());
  };

  const kullaniciGeriYukle = (id) => {
    setOnay({ mesaj: '⚠️ Bu kullanıcı geri yüklensin mi?', islem: () => kullaniciCopGeriYukle(id).then(() => { setUyari('✅ Kullanıcı geri yüklendi.'); load(); }) });
  };

  const kullaniciKaliciSil = (id) => {
    setOnay({ mesaj: '⚠️ Kalıcı olarak silinecek. Emin misiniz?', islem: () => { kullaniciCopKaliciSil(id).then(() => load()); } });
    kullaniciCopKaliciSil(id).then(() => load());
  };

  const thStyle = { padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontWeight: '700', color: '#555', fontSize: '12px', fontFamily: 'Segoe UI' };
  const tdStyle = { padding: '6px 10px', borderBottom: '1px solid #f0f0ee', fontSize: '12px', fontFamily: 'Segoe UI' };

  return (
    <div style={{ fontFamily: 'Segoe UI' }}>
      {uyari && <div onClick={()=>setUyari('')} style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}><div style={{background:'#fff',borderRadius:'10px',padding:'1.5rem',maxWidth:'320px',textAlign:'center'}}><p style={{fontSize:'13px',marginBottom:'1rem'}}>{uyari}</p><button onClick={()=>setUyari('')} style={{padding:'6px 16px',borderRadius:'6px',border:'1px solid #ccc',background:'#f97316',color:'#fff',cursor:'pointer',fontSize:'12px',fontWeight:'700'}}>Tamam</button></div></div>}
      {onay && <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}><div style={{background:'#fff',borderRadius:'10px',padding:'1.5rem',maxWidth:'320px',textAlign:'center'}}><p style={{fontSize:'13px',marginBottom:'1rem'}}>{onay.mesaj}</p><div style={{display:'flex',gap:'8px',justifyContent:'center'}}><button onClick={()=>{onay.islem();setOnay(null);}} style={{padding:'6px 16px',borderRadius:'6px',border:'1px solid #f97316',background:'#f97316',color:'#fff',cursor:'pointer',fontSize:'12px',fontWeight:'700'}}>Tamam</button><button onClick={()=>setOnay(null)} style={{padding:'6px 16px',borderRadius:'6px',border:'1px solid #ccc',background:'#fff',cursor:'pointer',fontSize:'12px',fontWeight:'700'}}>İptal</button></div></div></div>}
      <h1 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '1rem', paddingBottom: '.6rem', borderBottom: '1px solid #ddd' }}>🗑 Çöp Kutusu</h1>
      <div style={{ marginBottom: '.75rem', fontSize: '12px', color: '#888' }}>{items.length} silinen kayıt</div>
      <div style={{ overflowX: 'auto', border: '1px solid #e0e0e0', borderRadius: '10px', background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#f0f0ee' }}>
              <th style={thStyle}>İşlem</th>
              <th style={thStyle}>Müşteri</th>
              <th style={thStyle}>Bildirim No</th>
              <th style={thStyle}>Ürün Tanımı</th>
              <th style={thStyle}>Silen</th>
              <th style={thStyle}>Silinme Tarihi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Çöp kutusu boş.</td></tr>
            ) : items.map(r => {
              const v = r.kayit_verisi || {};
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #f0f0ee' }}>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    {isAdmin(currentUser) && <>
                      <button onClick={() => geriYukle(r.id)} style={{ padding: '3px 10px', fontSize: '11px', borderRadius: '5px', border: '1px solid #16a34a', background: '#fff', color: '#16a34a', cursor: 'pointer', fontWeight: '700', marginRight: '4px', fontFamily: 'Segoe UI' }}>↩ Geri Yükle</button>
                      <button onClick={() => kaliciSil(r.id)} style={{ padding: '3px 10px', fontSize: '11px', borderRadius: '5px', border: '1px solid #dc2626', background: '#fff', color: '#dc2626', cursor: 'pointer', fontWeight: '700', fontFamily: 'Segoe UI' }}>✕ Kalıcı Sil</button>
                    </>}
                    <span style={{fontSize:'11px',color:'#dc2626',fontWeight:'700',marginLeft:'4px'}}>Silindi</span>
                  </td>
                  <td style={tdStyle}>{v.musteri || ''}</td>
                  <td style={tdStyle}>{v.musteri_bildirim_no || ''}</td>
                  <td style={tdStyle}>{v.urun_tanimi || ''}</td>
                  <td style={tdStyle}>{r.silen_kullanici || ''}</td>
                  <td style={tdStyle}>{r.silinme_tarihi ? new Date(r.silinme_tarihi).toLocaleString('tr-TR') : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '1.5rem 0 .75rem' }}>👤 Silinen Kullanıcılar</h2>
      <div style={{ marginBottom: '.75rem', fontSize: '12px', color: '#888' }}>{kullanicilar.length} silinen kullanıcı</div>
      <div style={{ overflowX: 'auto', border: '1px solid #e0e0e0', borderRadius: '10px', background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#f0f0ee' }}>
              <th style={thStyle}>İşlem</th>
              <th style={thStyle}>Kullanıcı Adı</th>
              <th style={{...thStyle, width:'200px'}}>Rol(ler)</th>
              <th style={{...thStyle, width:'150px'}}>Silen</th>
              <th style={thStyle}>Silinme Tarihi</th>
            </tr>
          </thead>
          <tbody>
            {kullanicilar.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Çöp kutusu boş.</td></tr>
            ) : kullanicilar.map(k => (
              <tr key={k.id} style={{ borderBottom: '1px solid #f0f0ee' }}>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  {isAdmin(currentUser) && <>
                    <button onClick={() => kullaniciGeriYukle(k.id)} style={{ padding: '3px 10px', fontSize: '11px', borderRadius: '5px', border: '1px solid #16a34a', background: '#fff', color: '#16a34a', cursor: 'pointer', fontWeight: '700', marginRight: '4px', fontFamily: 'Segoe UI' }}>↩ Geri Yükle</button>
                    <button onClick={() => kullaniciKaliciSil(k.id)} style={{ padding: '3px 10px', fontSize: '11px', borderRadius: '5px', border: '1px solid #dc2626', background: '#fff', color: '#dc2626', cursor: 'pointer', fontWeight: '700', fontFamily: 'Segoe UI' }}>✕ Kalıcı Sil</button>
                  </>}
                  <span style={{fontSize:'11px',color:'#dc2626',fontWeight:'700',marginLeft:'4px'}}>Silindi</span>
                </td>
                <td style={tdStyle}>{k.kullanici_adi}</td>
                <td style={{...tdStyle, width:'200px'}}>{k.roller}</td>
                <td style={{...tdStyle, width:'150px'}}>{k.silen_kullanici}</td>
                <td style={tdStyle}>{k.silinme_tarihi ? new Date(k.silinme_tarihi).toLocaleString('tr-TR') : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}