import React, { useState, useEffect } from 'react';
import { kayitlariGetir, kayitSil, kayitGuncelle, API_BASE } from '../api';
import { useNavigate } from 'react-router-dom';

// Güvenli tarih farkı hesaplama (Şartname Madde 9 - Gün Cinsinden)
function getDaysBetween(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2 || dateStr1 === '—' || dateStr2 === '—') return null;
  
  const parseDate = (str) => {
    if (!str) return null;
    if (str instanceof Date) return str;
    const parts = String(str).trim().split('.');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return null;
  };

  const d1 = parseDate(dateStr1);
  const d2 = parseDate(dateStr2);
  
  if (!d1 || !d2 || isNaN(d1) || isNaN(d2)) return null;
  
  const diffTime = d2 - d1;
  // Negatif gün çıkarsa 0 kabul et, aksi halde farkı dön
  return diffTime >= 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0;
}

function fmtDays(n) {
  return n === null || n === undefined || isNaN(n) ? '—' : n + ' gün';
}

// ŞARTNAME MADDE 11: Durum Renkleri Yeniden Düzenlendi
// Açık = Kırmızı, Kapalı = Yeşil, İade Ret = Sarı 
function badge(d) {
  if (d === 'İADE RET') {
    return <span style={{background:'#b3e1f7', color:'#0439ca', padding:'2px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', border:'1px solid #0439ca', fontFamily:'Segoe UI'}}>İade Ret</span>;
  }
  if (d === 'KAPALI') {
    return <span style={{background:'#d6ffdd', color:'#16a34a', padding:'2px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', border:'1px solid #16a34a', fontFamily:'Segoe UI'}}>Kapalı</span>;
  }
  if (d === 'AÇIK') {
    return <span style={{background:'#fddbd6', color:'#dc2626', padding:'2px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', border:'1px solid #dc2626', fontFamily:'Segoe UI'}}>Açık</span>;
  }
  return <span style={{background:'#f3f4f6', color:'#6b7280', padding:'2px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', fontFamily:'Segoe UI'}}>{d || '—'}</span>;
}

// ŞARTNAME MADDE 9 & 10: Excel Formül Mantığı ve Otomatik Durum Yönetimi
function calcSureler(r) {
  const bugun = new Date();
  const bugunStr = `${bugun.getDate()}.${bugun.getMonth() + 1}.${bugun.getFullYear()}`;

  // Gelen verideki farklı tarih alan isimlerini (ihtiyaten) eşleştiriyoruz
  const bildirimTarihi = r.bildirim_tarihi || r.tarih;
  const depoTarihi = r.musteri_irsaliye_tarihi || r.depo_tarihi || r.bildirim_tarihi; 
  const isEmriTarihi = r.is_emri_acilis_tarihi || r.is_emri_tarihi;
  const sevkDepoTarihi = r.sevkiyat_depoya_aktarim_tarihi || r.sevkiyat_depo_tarihi;
  const sevkTarihi = r.iade_sevk_tarihi;

  // Şartname Madde 9 - Ara Süre Metrikleri Hesaplamaları
  const d1 = getDaysBetween(bildirimTarihi, r.musteri_irsaliye_tarihi || r.depo_tarihi); 
  const d2 = getDaysBetween(r.musteri_irsaliye_tarihi || r.depo_tarihi, isEmriTarihi); 
  const d3 = getDaysBetween(isEmriTarihi, r.kaliteye_gelis_tarihi || r.kalite_tarihi); 
  const d4 = getDaysBetween(r.kaliteye_gelis_tarihi || r.kalite_tarihi, r.uretime_gelis_tarihi || r.uretim_tarihi); 
  const d5 = getDaysBetween(r.kaliteye_aktarim_tarihi || r.kalite_2_tarihi, r.uretime_aktarim_tarihi || r.uretim_tarihi); 
  const d6 = getDaysBetween(sevkDepoTarihi, r.kaliteye_aktarim_tarihi || r.kalite_2_tarihi); 
  const d7 = getDaysBetween(sevkDepoTarihi, sevkTarihi); 

  // Şartname Madde 10 - Otomatik Durum Kuralları
  let dinamikDurum = 'AÇIK';
  if (r.musteri_kalite_mutabakat_durumu === 'İADE RET' || r.mutabakat === 'İADE RET' || r.mutabakat_durumu === 'İade Ret') {
    dinamikDurum = 'İADE RET';
  } else if (sevkTarihi && sevkTarihi !== '—' && sevkTarihi !== '') {
    dinamikDurum = 'KAPALI';
  }

  // Şartname Madde 9 Formülü: İade Kabul Edildikten Sonra Toplam Süre = (d2 + d7)
  let toplam = 0;

  if (dinamikDurum === 'KAPALI') {
    // Eğer d2 veya d7 adımları veri eksikliğinden dolayı null geldiyse, 0 gün basmak yerine
    // Sürecin Kapanış Tarihi ile Depoya Giriş Tarihi arasındaki net farkı formüle yedek olarak hesaplıyoruz:
    const netFark = getDaysBetween(depoTarihi, sevkTarihi);
    toplam = (d2 || 0) + (d7 || 0);
    
    if (toplam === 0 && netFark > 0) {
      toplam = netFark; // Alt süreç tarihleri girilmemişse ana akış farkını korur
    }
  } else {
    // Süreç henüz açık ise, ilk başlangıçtan bugüne kadar geçen toplam süreyi gösterir
    toplam = getDaysBetween(depoTarihi, bugunStr) || 0;
  }

  return { d1, d2, d3, d4, d5, d6, d7, toplam, dinamikDurum };
}

// ŞARTNAME MADDE 13: Rol Bazlı Yetkilendirme / Hücre Kilitleme Fonksiyonu
function checkFieldPermission(userRoles, field) {
  // 1. Admin her zaman tam yetkilidir.
  if (userRoles.includes('Admin')) return true;

  // 2. Rol bazlı izin tanımları
  const rolePermissions = {
    'Kalite': ['karel_is_kolu', 'musteri', 'musteri_bildirim_no', 'bildirim_tarihi', 'karel_stok_no', 'karel_stok_kodu', 'urun_tanimi', 'proje', 'hata_turu'],
    'Kalite – Proje (SOP)': ['mutabakat_durumu', 'musteri_kalite_mutabakat_durumu'],
    'Planlama': ['is_emri_acilis_tarihi', 'is_emri_tarihi'],
    'Planlama (Sevkiyat Depo)': ['musteri_irsaliye_tarihi', 'depo_tarihi', 'iade_sevk_tarihi'],
    'Üretim': ['uretime_gelis_tarihi', 'uretim_tarihi', 'kaliteye_aktarim_tarihi', 'kalite_2_tarihi']
  };

  // 3. Kullanıcının sahip olduğu herhangi bir rol, ilgili alana izin veriyorsa true dön
  return userRoles.some(role => rolePermissions[role]?.includes(field));
}

const READONLY_FIELDS = ['durum', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'toplam'];
const COL_W = [40,110,100,100,230,160,160,100,100,90,100,100,100,100,100,100,100,100,120,150,80,60,70];
export default function Rapor({ user }) {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({ musteri:'', bildirim_tarihi:'', bildirim_no:'', karel_stok:'', urun:'', proje:'', tarih_bas:'', tarih_bit:'', is_kolu:'', hata:'', mutabakat:'', garanti:'', durum:'' });
  const [editingCell, setEditingCell] = useState({ rowId: null, field: null, value: '' });
  const [silConfirm, setSilConfirm] = useState(null);
  const [uyari, setUyari] = useState('');

  // Kullanıcı rollerini safe bir şekilde array olarak alma (Prop'tan veya default boş array)
//const userRoles = user?.roles || user?.roller || ['Admin']; 
const userRoles = (user && user.roles) ? user.roles : ['Admin'];

  useEffect(() => { load(); }, []);
  useEffect(() => { applyFilters(); }, [records, filters]);

  /*const load = () => {
    kayitlariGetir().then(res => {
      const data = res.data;
      const hamKayitlar = Array.isArray(data) ? data : (data.results || data.kayitlar || []);
      
      const guncelKayitlar = hamKayitlar.map(r => {
        const { dinamikDurum } = calcSureler(r);
        return { ...r, durum: dinamikDurum };
      });

      setRecords(guncelKayitlar);
    }).catch(() => setRecords([]));
  };*/

  const load = () => {
    fetch(`${API_BASE}/api/iade-listesi/`)
      .then(res => res.json())
      .then(data => {
        const guncelKayitlar = data.map(r => {
          const { dinamikDurum } = calcSureler(r);
          return { ...r, durum: dinamikDurum };
        });
        
        setRecords(guncelKayitlar);
      })
      .catch(err => {
        console.error("Veri çekme hatası:", err);
        setRecords([]);
      });
  };

  const applyFilters = () => {
    let f = records.filter(r => {
      if (filters.musteri && !(r.musteri||'').toLowerCase().includes(filters.musteri.toLowerCase())) return false;
      if (filters.bildirim_tarihi && !(r.bildirim_tarihi||'').includes(filters.bildirim_tarihi)) return false;
      if (filters.bildirim_no && !(r.musteri_bildirim_no||'').toLowerCase().includes(filters.bildirim_no.toLowerCase())) return false;
      if (filters.karel_stok && !(r.karel_stok_no||r.karel_stok_kodu||'').trim().toUpperCase().includes(filters.karel_stok.trim().toUpperCase())) return false;
      if (filters.urun && !(r.urun_tanimi||'').toLowerCase().includes(filters.urun.toLowerCase())) return false;
      if (filters.proje && !(r.proje||'').toLowerCase().includes(filters.proje.toLowerCase())) return false;
      if (filters.is_kolu && r.karel_is_kolu !== filters.is_kolu) return false;
      if (filters.hata && (r.hata_turu||'').toLocaleUpperCase('tr-TR') !== filters.hata.toLocaleUpperCase('tr-TR')) return false;
      if (filters.mutabakat) {
        const secilen = filters.mutabakat.toLocaleUpperCase('tr-TR');
        const m1 = (r.mutabakat_durumu||'').toLocaleUpperCase('tr-TR');
        const m2 = (r.musteri_kalite_mutabakat_durumu||'').toLocaleUpperCase('tr-TR');
        if (m1 !== secilen && m2 !== secilen) return false;
      }
      if (filters.garanti && (r.garanti_durumu||'').toLocaleUpperCase('tr-TR') !== filters.garanti.toLocaleUpperCase('tr-TR')) return false;
      if (filters.durum && r.durum !== filters.durum) return false;
      if (filters.tarih_bas || filters.tarih_bit) {
        const parts = String(r.bildirim_tarihi).split('.');
        const rd = parts.length === 3 ? new Date(parts[2], parts[1]-1, parts[0]) : null;
        if (filters.tarih_bas && rd && rd < new Date(filters.tarih_bas)) return false;
        if (filters.tarih_bit && rd && rd > new Date(filters.tarih_bit)) return false;
        if ((filters.tarih_bas || filters.tarih_bit) && !rd) return false;
      }
      return true;
    });
    setFiltered(f);
  };

  const startEdit = (row, field, currentValue, event) => {
    event.stopPropagation();
    if (READONLY_FIELDS.includes(field)) return;
    
    // ŞARTNAME MADDE 13: Hücreye tıklanınca departman yetki kontrolü yapılır
    if (!checkFieldPermission(userRoles, field)) {
      setUyari('❌ Bu alanı düzenlemek için departman yetkiniz bulunmamaktadır.');
      return;
    }
    
    setEditingCell({ rowId: row.id, field, value: currentValue || '' });
  };

  const saveEdit = async (rowId, field) => {
    if (!editingCell.rowId || editingCell.field !== field) return;
    
    const newValue = editingCell.value;
    const oldRow = records.find(r => r.id === rowId);
    if (!oldRow) return;
    
    if (oldRow[field] === newValue) {
      setEditingCell({ rowId: null, field: null, value: '' });
      return;
    }
    
    try {
      const updatedMockRow = { ...oldRow, [field]: newValue };
      const { dinamikDurum } = calcSureler(updatedMockRow);
      
      await kayitGuncelle(rowId, { 
        [field]: newValue, 
        durum: dinamikDurum 
      });
      
      setRecords(prev => prev.map(r => r.id === rowId ? { ...r, [field]: newValue, durum: dinamikDurum } : r));
      
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      setUyari('❌ Kaydedilemedi: ' + (error.response?.data?.message || error.message));
    }
    setEditingCell({ rowId: null, field: null, value: '' });
  };

  const handleEditChange = (e) => {
    setEditingCell(prev => ({ ...prev, value: e.target.value }));
  };

  const handleKeyDown = (e, rowId, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit(rowId, field);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.currentTarget.onblur = null; 
      setEditingCell({ rowId: null, field: null, value: '' });
    }
  };

  const renderCell = (row, field, displayValue, isDropdown, dropdownOptions) => {
    const isEditing = editingCell.rowId === row.id && editingCell.field === field;
    
    if (isEditing) {
      if (isDropdown) {
        return (
          <select
            value={editingCell.value}
            onChange={handleEditChange}
            onBlur={() => saveEdit(row.id, field)}
            onKeyDown={(e) => handleKeyDown(e, row.id, field)}
            autoFocus
            style={{ width: '100%', padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #1a56db', fontFamily:'Segoe UI' }}
          >
            {dropdownOptions.map(opt => (
              <option key={opt} value={opt}>{opt || '(Boş)'}</option>
            ))}
          </select>
        );
      } else {
        return (
          <input
            type="text"
            value={editingCell.value}
            onChange={handleEditChange}
            onBlur={() => saveEdit(row.id, field)}
            onKeyDown={(e) => handleKeyDown(e, row.id, field)}
            autoFocus
            style={{ width: '100%', padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #1a56db', boxSizing: 'border-box', fontFamily:'Segoe UI' }}
          />
        );
      }
    }
    return displayValue || '—';
  };

  const exportCSV = () => {
    // ŞARTNAME MADDE 11: Kolon başlıklarına uygun CSV formatı
    const headers = [
      'Müşteri','İş Kolu','Bildirim No','Bildirim Tarihi','Karel Stok No','Ürün Tanımı','Proje','Hata Türü','Mutabakat','Garanti',
      'Bill-Depo','Depo-İşEm','İşEm-Kal','Kal-Üret','Üret-Kal','Kal-SevkD','SevkD-Sevk','İade Sevk Tarihi','İade Kabul Sonrası Toplam Süre','Durum'
    ];
    
    const rows = filtered.map(r => {
      const s = calcSureler(r);
      return [
        r.musteri, r.karel_is_kolu, r.musteri_bildirim_no, r.bildirim_tarihi, r.karel_stok_no || r.karel_stok_kodu, r.urun_tanimi, r.proje, r.hata_turu, r.mutabakat_durumu || r.musteri_kalite_mutabakat_durumu, r.garanti_durumu,
        fmtDays(s.d1), fmtDays(s.d2), fmtDays(s.d3), fmtDays(s.d4), fmtDays(s.d5), fmtDays(s.d6), fmtDays(s.d7), r.iade_sevk_tarihi, fmtDays(s.toplam), r.durum
      ].map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(';');
    });
    
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + [headers.join(';'), ...rows].join('\n')], {type:'text/csv;charset=utf-8'}));
    a.download = 'iade_raporu.csv'; 
    a.click();
  };

  const sil = (id) => {
    setSilConfirm(id);
  };
  const silOnayla = () => {
    kayitSil(silConfirm).then(() => { load(); setSilConfirm(null); });
  };

  

  const acik = filtered.filter(r => r.durum === 'AÇIK').length;
  const kapali = filtered.filter(r => r.durum === 'KAPALI').length;
  const ret = filtered.filter(r => r.durum === 'İADE RET').length;

  const isKoluOptions = ['', 'SAVUNMA ARGE', 'SAVUNMA EMS'];
  const hataOptions = ['', 'Fonksiyon Hatası', 'Yazılım Hatası', 'Kablaj Hatası', 'Kısa Devre', 'Hata Bulunamadı / Hata Yok', 'Hatalı/Arızalı Malzeme', 'Hatalı Montaj', 'Malzeme Bacağı Uzun/Kısa', 'Malzeme Kaymış', 'Malzeme Bacağı Girmemiş', 'Fazla Malzeme', 'Yanlış Malzeme Montajı', 'Yetersiz Lehim', 'Lehimsiz', 'Lehim Uzantısı/Sıçraması', 'Lehim Topu', 'Gaz Kaçağı', 'Fazla Lehim', 'Tombstone (Mezartaşı)', 'Soğuk/Çatlak Lehim', 'Pad Kalkması', 'Lehimlenebilirlik', 'Billborading', 'ECO Uygulama Hatası', 'Ürün Dökümanı Uygulanmamış / Eksik Uygulanmış', 'Hatalı/Eksik Sevk Donanımı', 'BDK Hatası', 'Eksik Malzeme', 'Malzeme Yönü Ters', 'Havada Malzeme', 'Hasarlı/Darbeli Malzeme', 'Ambalaj Hatası', 'Etiket Hatası', 'Kaplama Uygulama Hatası', 'Kimyasal Uygulama Hatası', 'Kötü Görünüm', 'İşleyiş Hatası', 'Gruplama Hatası', 'Sızdırma Hatası'];
  const mutabakatOptions = ['', 'İade Kabul', 'İade Ret'];
  const garantiOptions = ['', 'Garanti İçi', 'Garanti Dışı', 'Belirsiz'];

  const thStyle = { padding:'8px 7px', textAlign:'left', borderBottom:'1px solid #e0e0e0', whiteSpace:'normal', fontWeight:'700', color:'#555', fontSize:'11px', fontFamily:'Segoe UI', boxSizing:'border-box', overflow:'hidden' };
  const tdStyle = { padding:'6px 7px', borderBottom:'1px solid #f0f0ee', whiteSpace:'nowrap', fontSize:'11px', fontFamily:'Segoe UI', boxSizing:'border-box', overflow:'hidden', textOverflow:'ellipsis' };
  const inputStyle = { width:'calc(100% - 4px)', margin:'0 2px', padding:'4px 6px', border:'1px solid #ccc', borderRadius:'5px', fontSize:'11px', fontFamily:'Segoe UI', boxSizing:'border-box' };
  const selectStyle = { width:'calc(100% - 4px)', margin:'0 2px', padding:'4px 6px', border:'1px solid #ccc', borderRadius:'5px', fontSize:'11px', fontFamily:'Segoe UI', boxSizing:'border-box' };

  return (
    <>
    {silConfirm && (
      <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
        <div style={{background:'#fff',borderRadius:'10px',padding:'1.5rem',maxWidth:'320px',textAlign:'center'}}>
          <p style={{fontSize:'13px',marginBottom:'1rem'}}>Bu kaydı silmek istediğinize emin misiniz?</p>
          <div style={{display:'flex',gap:'8px',justifyContent:'center'}}>
            <button onClick={silOnayla} style={{padding:'6px 16px',borderRadius:'6px',border:'1px solid #dc2626',background:'#dc2626',color:'#fff',cursor:'pointer',fontSize:'12px',fontWeight:'700'}}>Sil</button>
            <button onClick={()=>setSilConfirm(null)} style={{padding:'6px 16px',borderRadius:'6px',border:'1px solid #ccc',background:'#fff',cursor:'pointer',fontSize:'12px',fontWeight:'700'}}>İptal</button>
          </div>
        </div>
      </div>
    )}
    {uyari && <div onClick={()=>setUyari('')} style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}><div style={{background:'#fff',borderRadius:'10px',padding:'1.5rem',maxWidth:'320px',textAlign:'center'}}><p style={{fontSize:'13px',marginBottom:'1rem'}}>{uyari}</p><button onClick={()=>setUyari('')} style={{padding:'6px 16px',borderRadius:'6px',border:'1px solid #ccc',background:'#f97316',color:'#fff',cursor:'pointer',fontSize:'12px',fontWeight:'700'}}>Tamam</button></div></div>}
    <div style={{fontFamily:'Segoe UI'}}>
      <h1 style={{fontSize:'17px',fontWeight:'700',marginBottom:'1rem',paddingBottom:'.6rem',borderBottom:'1px solid #ddd'}}>📊 İade Takip Raporu</h1>
      
      {/* Üst İstatistik Kartları - Şartnameye Uygun Renk Dağılımları */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'1rem'}}>
        {[
          ['Toplam Kayıt', filtered.length, '#1a1a1a'], 
          ['Açık (Süreç Devam)', acik, '#dc2626'],
          ['Kapalı (Tamamlanan)', kapali, '#16a34a'],
          ['İade Ret', ret, '#0439ca'] // Şartname Madde 11: İade Ret = Sarı
        ].map(([l,v,c]) => (
          <div key={l} style={{background:'#fff',border:'1px solid #e0e0e0',borderRadius:'8px',padding:'.7rem .9rem'}}>
            <div style={{fontSize:'11px',color:'#888',fontWeight:'700',textTransform:'uppercase',marginBottom:'3px'}}>{l}</div>
            <div style={{fontSize:'26px',fontWeight:'700',color:c}}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:'8px',justifyContent:'flex-end',marginBottom:'.75rem'}}>
        <button onClick={() => setFilters({musteri:'',bildirim_no:'',karel_stok:'',urun:'',proje:'',tarih_bas:'',tarih_bit:'',is_kolu:'',hata:'',mutabakat:'',garanti:'',durum:''})} style={{padding:'6px 18px',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:'pointer',border:'1px solid #ccc',background:'#fff'}}>↻ Filtreleri Temizle</button>
        <button onClick={exportCSV} style={{padding:'6px 18px',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:'pointer',border:'1px solid #16a34a',background:'#16a34a',color:'#fff'}}>⇓ CSV İndir</button>
      </div>

<div style={{overflowX:'auto',marginBottom:'4px'}} onScroll={e=>{document.querySelector('.tablo-scroll').scrollLeft=e.target.scrollLeft}}><div style={{height:'12px',width:'2270px'}}></div></div>
      <div className="tablo-scroll" style={{overflowX:'auto',border:'1px solid #e0e0e0',borderRadius:'10px',background:'#fff'}} onScroll={e=>{e.target.previousSibling&&(e.target.previousSibling.scrollLeft=e.target.scrollLeft)}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'11px',minWidth:'2270px',tableLayout:'fixed'}}>
          <thead>
            <tr style={{background:'#f0f0ee'}}>
              <th style={{...thStyle,width:COL_W[0]}}>#</th>
              {/* ŞARTNAME MADDE 11: Eksik olan Sol Kimlik Sütunları Tabloya Eklendi */}
              <th style={{...thStyle,width:COL_W[1]}}>Müşteri</th>
              <th style={{...thStyle,width:COL_W[2]}}>İş Kolu</th>
              <th style={{...thStyle,width:COL_W[3]}}>Bildirim No</th>
              <th style={{...thStyle,width:COL_W[4]}}>Bildirim Tarihi</th>
              <th style={{...thStyle,width:COL_W[5]}}>Karel Stok No</th>
              <th style={{...thStyle,width:COL_W[6]}}>Ürün Tanımı</th>
              <th style={{...thStyle,width:COL_W[7]}}>Proje</th>
              <th style={{...thStyle,width:COL_W[8]}}>Hata Türü</th>
              <th style={{...thStyle,width:COL_W[9]}}>Mutabakat</th>
              <th style={{...thStyle,width:COL_W[10]}}>Garanti</th>
              <th style={{...thStyle,width:COL_W[11]}}>Bildirim → Depo Arası Geçen Süre</th>
              <th style={{...thStyle,width:COL_W[12]}}>Depo → İş Emri Arası Geçen Süre</th>
              <th style={{...thStyle,width:COL_W[13]}}>İş Emri → Kalite Arası Geçen Süre</th>
              <th style={{...thStyle,width:COL_W[14]}}>Kalite → Üretim Arası Geçen Süre</th>
              <th style={{...thStyle,width:COL_W[15]}}>Üretim → Kalite Arası Geçen Süre</th>
              <th style={{...thStyle,width:COL_W[16]}}>Kalite → Sevkiyat Depo Arası Geçen Süre</th>
              <th style={{...thStyle,width:COL_W[17]}}>Sevkiyat Depo → Sevkiyat Arası Geçen Süre</th>
              <th style={{...thStyle, background: '#dcf1f5', color: '#3f3e3e', width:COL_W[18]}}>İade Sevk Tarihi</th>
              <th style={{...thStyle,width:COL_W[19]}}>İade Kabul Sonrası Toplam Süre</th>
              <th style={{...thStyle,width:COL_W[20]}}>Durum</th>
              <th style={{...thStyle,width:COL_W[21]}}>Sil</th>
              <th style={{...thStyle,width:COL_W[22]}}>Aç</th>
            </tr>
            <tr style={{background:'#fafaf8',borderBottom:'2px solid #e0e0e0'}}>
            <th></th> {/* ID sütunu boşluğu */}
            <th style={{padding:'4px 5px'}}><input style={inputStyle} placeholder="Müşteri Ara..." value={filters.musteri} onChange={e=>setFilters(f=>({...f,musteri:e.target.value}))} /></th>
            <th style={{padding:'4px 5px'}}><select style={selectStyle} value={filters.is_kolu} onChange={e=>setFilters(f=>({...f,is_kolu:e.target.value}))}><option value="">Tümü</option><option>SAVUNMA ARGE</option><option>SAVUNMA EMS</option></select></th>
            <th style={{padding:'4px 5px'}}><input style={inputStyle} placeholder="No Ara..." value={filters.bildirim_no} onChange={e=>setFilters(f=>({...f,bildirim_no:e.target.value}))} /></th>
            <th style={{padding:'4px 5px'}}>
              <div style={{display:'flex',gap:'4px'}}>
                <input type="date" style={{...inputStyle,width:'50%',margin:0,padding:'4px 3px'}} value={filters.tarih_bas||''} onChange={e=>setFilters(f=>({...f,tarih_bas:e.target.value}))} />
                <input type="date" style={{...inputStyle,width:'50%',margin:0,padding:'4px 3px'}} value={filters.tarih_bit||''} onChange={e=>setFilters(f=>({...f,tarih_bit:e.target.value}))} />
              </div>
            </th>
            <th style={{padding:'4px 5px'}}><input style={inputStyle} placeholder="Stok Ara..." value={filters.karel_stok} onChange={e=>setFilters(f=>({...f,karel_stok:e.target.value}))} /></th>
            <th style={{padding:'4px 5px'}}><input style={inputStyle} placeholder="Ürün Ara..." value={filters.urun} onChange={e=>setFilters(f=>({...f,urun:e.target.value}))} /></th>
            <th style={{padding:'4px 5px'}}><input style={inputStyle} placeholder="Proje Ara..." value={filters.proje} onChange={e=>setFilters(f=>({...f,proje:e.target.value}))} /></th>
            <th style={{padding:'4px 5px'}}><select style={selectStyle} value={filters.hata} onChange={e=>setFilters(f=>({...f,hata:e.target.value}))}><option value="">Tümü</option>{hataOptions.slice(1).map(o => <option key={o}>{o}</option>)}</select></th>
            <th style={{padding:'4px 5px'}}><select style={selectStyle} value={filters.mutabakat} onChange={e=>setFilters(f=>({...f,mutabakat:e.target.value}))}><option value="">Tümü</option><option>İade Kabul</option><option>İade Ret</option></select></th>
            <th style={{padding:'4px 5px'}}><select style={selectStyle} value={filters.garanti} onChange={e=>setFilters(f=>({...f,garanti:e.target.value}))}><option value="">Tümü</option><option>Garanti İçi</option><option>Garanti Dışı</option><option>Belirsiz</option></select></th>
            {/* Ara d1-d7 kolonlarının filtre altı boşlukları */}
            <th></th><th></th><th></th><th></th><th></th><th></th><th></th>
            <th></th> {/* İade Sevk Tarihi altı boşluk */}
            <th></th> {/* Toplam Süre altı boşluk */}
            <th style={{padding:'4px 5px'}}><select style={selectStyle} value={filters.durum} onChange={e=>setFilters(f=>({...f,durum:e.target.value}))}><option value="">Tümü</option><option value="AÇIK">Açık</option><option value="KAPALI">Kapalı</option><option value="İADE RET">İade Ret</option></select></th>
            <th></th>
            <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={23} style={{textAlign:'center',padding:'2rem',color:'#999'}}>Kayıt bulunamadı.</td></tr>
            ) : filtered.map((r, i) => {
              const s = calcSureler(r);
              return (
                <tr key={r.id} style={{cursor:'default'}} onMouseEnter={e=>e.currentTarget.style.background='#fafaf8'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                  <td style={{...tdStyle,width:COL_W[0]}}>{i+1}</td>
                  <td style={{...tdStyle,width:COL_W[1]}} onDoubleClick={(e) => startEdit(r, 'musteri', r.musteri, e)}>{renderCell(r, 'musteri', r.musteri, false, [])}</td>
                  <td style={{...tdStyle,width:COL_W[2]}} onDoubleClick={(e) => startEdit(r, 'karel_is_kolu', r.karel_is_kolu, e)}>{renderCell(r, 'karel_is_kolu', r.karel_is_kolu, true, isKoluOptions)}</td>
                  <td style={{...tdStyle,width:COL_W[3]}} onDoubleClick={(e) => startEdit(r, 'musteri_bildirim_no', r.musteri_bildirim_no, e)}>{renderCell(r, 'musteri_bildirim_no', r.musteri_bildirim_no, false, [])}</td>
                  <td style={{...tdStyle,width:COL_W[4]}} onDoubleClick={(e) => startEdit(r, 'bildirim_tarihi', r.bildirim_tarihi, e)}>{renderCell(r, 'bildirim_tarihi', r.bildirim_tarihi, false, [])}</td>
                  <td style={{...tdStyle,width:COL_W[5]}} onDoubleClick={(e) => startEdit(r, 'karel_stok_no', r.karel_stok_no || r.karel_stok_kodu, e)}>{renderCell(r, 'karel_stok_no', r.karel_stok_no || r.karel_stok_kodu, false, [])}</td>
                  <td style={{...tdStyle,width:COL_W[6]}} onDoubleClick={(e) => startEdit(r, 'urun_tanimi', r.urun_tanimi, e)}>{renderCell(r, 'urun_tanimi', r.urun_tanimi, false, [])}</td>
                  <td style={{...tdStyle,width:COL_W[7]}} onDoubleClick={(e) => startEdit(r, 'proje', r.proje, e)}>{renderCell(r, 'proje', r.proje, false, [])}</td>
                  <td style={{...tdStyle,width:COL_W[8]}} onDoubleClick={(e) => startEdit(r, 'hata_turu', r.hata_turu, e)}>{renderCell(r, 'hata_turu', r.hata_turu, true, hataOptions)}</td>
                  <td style={{...tdStyle,width:COL_W[9]}} onDoubleClick={(e) => startEdit(r, 'musteri_kalite_mutabakat_durumu', r.musteri_kalite_mutabakat_durumu || r.mutabakat_durumu, e)}>{renderCell(r, 'musteri_kalite_mutabakat_durumu', r.musteri_kalite_mutabakat_durumu || r.mutabakat_durumu, true, mutabakatOptions)}</td>
                  <td style={{...tdStyle,width:COL_W[10]}} onDoubleClick={(e) => startEdit(r, 'garanti_durumu', r.garanti_durumu, e)}>{renderCell(r, 'garanti_durumu', r.garanti_durumu, true, garantiOptions)}</td>
                  
                  {/* Ara Süre Metrik Sütunları */}
                  <td style={{...tdStyle,textAlign:'center',width:COL_W[11]}}>{fmtDays(s.d1)}</td>
                  <td style={{...tdStyle,textAlign:'center',width:COL_W[12]}}>{fmtDays(s.d2)}</td>
                  <td style={{...tdStyle,textAlign:'center',width:COL_W[13]}}>{fmtDays(s.d3)}</td>
                  <td style={{...tdStyle,textAlign:'center',width:COL_W[14]}}>{fmtDays(s.d4)}</td>
                  <td style={{...tdStyle,textAlign:'center',width:COL_W[15]}}>{fmtDays(s.d5)}</td>
                  <td style={{...tdStyle,textAlign:'center',width:COL_W[16]}}>{fmtDays(s.d6)}</td>
                  <td style={{...tdStyle,textAlign:'center',width:COL_W[17]}}>{fmtDays(s.d7)}</td>
                  
                  {/* İade Sevk Tarihi Düzenleme Hücresi */}
                  <td style={{...tdStyle, background: '#ebf9ff', textAlign: 'center', width:COL_W[18]}} onDoubleClick={(e) => startEdit(r, 'iade_sevk_tarihi', r.iade_sevk_tarihi, e)}>
                    {renderCell(r, 'iade_sevk_tarihi', r.iade_sevk_tarihi, false, [])}
                  </td>

                  {/* ŞARTNAME MADDE 9: Sadece Şartnameye Uygun Formül Toplamı Basılır */}
                  <td style={{...tdStyle,textAlign:'center',fontWeight:'700',color:'#1e3a8a',width:COL_W[19]}}>{fmtDays(s.toplam)}</td>
                  <td style={{...tdStyle,width:COL_W[20]}}>{badge(r.durum)}</td>
                  <td style={{...tdStyle,width:COL_W[21]}}><button onClick={() => sil(r.id)} style={{padding:'2px 8px',fontSize:'11px',borderRadius:'5px',border:'1px solid #dc2626',background:'#fff',color:'#dc2626',cursor:'pointer', fontFamily:'Segoe UI'}}>🗑 Sil</button></td>
                  <td style={{...tdStyle,width:COL_W[22]}}><button onClick={() => navigate('/kayit', { state: { record: r } })} style={{padding:'2px 8px',fontSize:'11px',borderRadius:'5px',border:'1px solid #1a56db',background:'#fff',color:'#1a56db',cursor:'pointer', fontFamily:'Segoe UI'}}>↗ Aç</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}