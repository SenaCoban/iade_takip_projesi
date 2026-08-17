import React, { useState, useEffect } from 'react';
import { kayitEkle, API_BASE } from '../api';
import { useLocation, useNavigate } from 'react-router-dom';
import { kayitGuncelle } from '../api';

const HATA_TURLERI = ['Hatalı/Arızalı Malzeme','BDK Hatası','Eksik Malzeme','Malzeme Yönü Ters','Havada Malzeme','Hasarlı/Darbeli Malzeme','Hatalı Montaj','Malzeme Bacağı Uzun/Kısa','Malzeme Kaymış','Malzeme Bacağı Girmemiş','Fazla Malzeme','Yanlış Malzeme Montajı','Yetersiz Lehim','Lehimsiz','Lehim Uzantısı/Sıçraması','Kısa Devre','Lehim Topu','Gaz Kaçağı','Fazla Lehim','Tombstone (mezartaşı)','Soğuk/Çatlak Lehim','Pad Kalkması','Lehimlenebilirlik','Billboarding','Ambalaj Hatası','Etiket Hatası','ECO Uygulama Hatası','Ürün Dökümanı Uygulanmamış / Eksik Uygulanmış','Hatalı/Eksik Sevk Donanımı','Fonksiyon Hatası','Yazılım Hatası','Kablaj Hatası','Kaplama Uygulama Hatası','Kimyasal Uygulama Hatası','Kötü Görünüm','İşleyiş/Proses Hatası','Gruplama Hatası','Hata Bulunamadı / Hata Yok','Sızdırma Hatası'];

const FONT_FAMILY = 'Arial, sans-serif';

const emptyForm = {
  karel_is_kolu:'', musteri_iade_nedeni:'', musteri:'', musteri_bildirim_no:'', bildirim_tarihi:'',
  musteri_stok_no:'', karel_stok_no:'', urun_tanimi:'', proje:'', bildirilen_seri_no:'',
  kaliteye_gelis_tarihi:'', uretim_aktarim_tarihi:'', sevkiyat_depoya_aktarim_tarihi:'',
  kalite_kontrol_8d:'', eco_dk_kontrolu:'', kaynaginda_denetim:'', hata_turu:'',
  mutabakat_durumu:'', nihai_garanti_mutabakat:'', musteri_onarim_mutabakat:'',
  ilk_sevk_tarihi:'', garanti_durumu:'', faturali_faturasiz:'', is_emri_acilis_tarihi:'',
  is_emri:'', musteri_irsaliye_no:'', musteri_irsaliye_tarihi:'', musteri_siparis_no:'',
  gelen_urun_seri_no:'', karel_irsaliye_no:'', iade_sevk_tarihi:'', hedeflenen_onarim_tarihi:'',
  gerceklesen_onarim_tarihi:'', onarim_aciklama:'', proforma_numarasi:'', kaliteye_aktarim_tarihi:'',
  eco_dk_kontrolu_uretim:'', hedeflenen_hata_tespit_tarihi:'', gerceklesen_hata_tespit_tarihi:'',
  uretim_bulgusu:'', malzeme_planlama:'', nff_durumu:'', nihai_garanti_durumu:'', bekleme_nedeni:'',
};

function parseDate(s) {
  if (!s) return null;
  const p = s.split('.');
  if (p.length === 3) return new Date(p[2], p[1]-1, p[0]);
  return null;
}
function daysDiff(a, b) {
  if (!a || !b) return null;
  return Math.round((b-a)/86400000);
}
function fmtDays(n) {
  return (n===null||n===undefined||isNaN(n)) ? '—' : n+' gün';
}

const labelStyle = { fontFamily: FONT_FAMILY, fontSize:'11px', color:'#666', fontWeight:'700', textTransform:'uppercase', letterSpacing:'.3px', display:'block', marginBottom:'3px' };
const inputStyle = { fontFamily: FONT_FAMILY, width:'100%', padding:'5px 8px', border:'1px solid #ccc', borderRadius:'6px', fontSize:'12px', boxSizing:'border-box' };
const sectionStyle = { fontFamily: FONT_FAMILY, background:'#fff', border:'1px solid #e0e0e0', borderRadius:'10px', marginBottom:'.8rem', overflow:'hidden' };
const sectionTitleStyle = { fontFamily: FONT_FAMILY, background:'#f0f0ee', padding:'.55rem 1rem', fontSize:'12px', fontWeight:'700', color:'#444', borderBottom:'1px solid #e0e0e0' };
const sectionBodyStyle = { fontFamily: FONT_FAMILY, padding:'.7rem 1rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.5rem .9rem' };
const saveBtn = { fontFamily:FONT_FAMILY, padding:'6px 18px', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:'pointer', border:'1px solid #38bdf8', background:'#8cdbfd', color:'#000000' };
const saveBtnRow = { padding:'.6rem 1rem', borderTop:'1px solid #f0f0ee', display:'flex', justifyContent:'flex-end' };

function Field({ label, field, type='text', options=[], form, set, disabled=false }) {
  const isDate = label.toLowerCase().includes('tarih') || label.includes('Tarih') || label.includes('TARİH') || label.includes('tarihi') || label.includes('TARİHİ');

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'3px', fontFamily: FONT_FAMILY }}>
      <label style={labelStyle}>{label}</label>
      {type === 'select' ? (
        <select value={form[field]} onChange={e=>set(field,e.target.value)} style={{...inputStyle, opacity: disabled ? 0.5 : 1}} disabled={disabled}>
          <option value="">Seçiniz</option>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={form[field]} onChange={e=>set(field,e.target.value)} style={{...inputStyle, minHeight:'50px', resize:'vertical', opacity: disabled ? 0.5 : 1}} disabled={disabled} />
      ) : (
        <input
          type="text"
          value={form[field]}
          maxLength={isDate ? 10 : undefined}
          onChange={e => {
            let v = e.target.value.replace(/\D/g, '');
            if (isDate) {
              if (v.length > 8) v = v.slice(0, 8);
              if (v.length >= 5) {
                v = v.slice(0, 2) + '.' + v.slice(2, 4) + '.' + v.slice(4, 8);
              } else if (v.length >= 3) {
                v = v.slice(0, 2) + '.' + v.slice(2, 4);
              }
            }
            set(field, isDate ? v : e.target.value);
          }}
          style={{...inputStyle, opacity: disabled ? 0.5 : 1, background: disabled ? '#f5f5f5' : ''}}
          placeholder={isDate ? 'GG.AA.YYYY' : ''}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export default function KayitEkrani() {
  const location = useLocation();
  const navigate = useNavigate();
  const editRecord = location.state?.record || null;
  const [form, setForm] = useState(editRecord || emptyForm);
  const [editId, setEditId] = useState(editRecord?.id || null);
  const [sureler, setSureler] = useState({});
  const [durum, setDurum] = useState('—');
  const [uyari, setUyari] = useState('');
  const [ekSeriler, setEkSeriler] = useState([]); // [{id, seri_no, is_emri, isNew}]

  useEffect(() => {
    if (editId) {
      fetch(`${API_BASE}/api/kayit/${editId}/seriler/`)
        .then(r => r.json())
        .then(data => setEkSeriler((data || []).map(s => ({ id: s.id, seri_no: s.seri_no || '', is_emri: s.is_emri || '', isNew: false }))))
        .catch(() => {});
    }
  }, [editId]);

  const ekSeriEkle = () => setEkSeriler(prev => [...prev, { id: null, seri_no: '', is_emri: '', isNew: true }]);
  const ekSeriGuncelle = (idx, field, val) => setEkSeriler(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  const ekSeriSil = (idx) => {
    const satir = ekSeriler[idx];
    if (satir.id) {
      fetch(`${API_BASE}/api/seri/${satir.id}/sil/`, { method: 'POST' }).catch(() => {});
    }
    setEkSeriler(prev => prev.filter((_, i) => i !== idx));
  };
  const ekSerileriKaydet = (kayitId) => {
    ekSeriler.forEach(s => {
      if (!s.seri_no && !s.is_emri) return;
      if (s.isNew) {
        fetch(`${API_BASE}/api/kayit/${kayitId}/seri/ekle/`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seri_no: s.seri_no, is_emri: s.is_emri })
        }).catch(() => {});
      } else if (s.id) {
        fetch(`${API_BASE}/api/seri/${s.id}/guncelle/`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seri_no: s.seri_no, is_emri: s.is_emri })
        }).catch(() => {});
      }
    });
  };

  const set = (field, val) => {
    const newForm = { ...form, [field]: val };
    setForm(newForm);
    calcSureler(newForm);
    if (field === 'karel_stok_no' && val.length > 5) {
      fetch(`${API_BASE}/api/iskolu/?karel_stok_no=${encodeURIComponent(val)}`)
        .then(r => r.json())
        .then(data => {
          if (data.iskolu) {
            const updated = { ...newForm, karel_is_kolu: data.iskolu === 'Savunma EMS' ? 'SAVUNMA EMS' : data.iskolu === 'Savunma' ? 'SAVUNMA ARGE' : data.iskolu, urun_tanimi: data.kalem_tanim || newForm.urun_tanimi };
            setForm(updated);
            calcSureler(updated);
          }
        });
    }
    if (field === 'musteri_stok_no' && val.length > 3) {
      fetch(`${API_BASE}/api/musteri-stok-no-bilgi/?musteri_stok_no=${encodeURIComponent(val)}`)
        .then(r => r.json())
        .then(data => {
          if (data.bulundu) {
            const updated = {
              ...newForm,
              karel_stok_no: newForm.karel_stok_no || data.karel_stok_no,
              proje: newForm.proje || data.proje,
              urun_tanimi: newForm.urun_tanimi || data.urun_tanimi,
            };
            setForm(updated);
            calcSureler(updated);
          }
        });
    }
  };

  const calcSureler = (f) => {
    const bil=parseDate(f.bildirim_tarihi), irs=parseDate(f.musteri_irsaliye_tarihi);
    const iem=parseDate(f.is_emri_acilis_tarihi), kge=parseDate(f.kaliteye_gelis_tarihi);
    const ura=parseDate(f.uretim_aktarim_tarihi), kat=parseDate(f.kaliteye_aktarim_tarihi);
    const sda=parseDate(f.sevkiyat_depoya_aktarim_tarihi), isv=parseDate(f.iade_sevk_tarihi);
    const d2=daysDiff(irs,iem), d7=daysDiff(sda,isv);
    setSureler({
      d1:fmtDays(daysDiff(bil,irs)), d2:fmtDays(d2),
      d3:fmtDays(daysDiff(iem,kge)), d4:fmtDays(daysDiff(kge,ura)),
      d5:fmtDays(daysDiff(kat,ura)), d6:fmtDays(daysDiff(kat,sda)),
      d7:fmtDays(d7), toplam:fmtDays((d2!==null&&d7!==null)?d2+d7:null)
    });
    let d = '—';
    if (f.mutabakat_durumu==='İade Ret') d='İADE RET';
    else if (f.mutabakat_durumu==='İade Kabul') d=f.iade_sevk_tarihi?'KAPALI':'AÇIK';
    setDurum(d);
  };

  const save = () => {
    if (!form.musteri_bildirim_no) {
      setUyari('⚠️ Lütfen formu doldurunuz!');
      return;
    }
    const payload = { ...form, durum };
    if (editId) {
      kayitGuncelle(editId, payload).then(() => {
        ekSerileriKaydet(editId);
        setUyari('Kayıt güncellendi.');
        navigate('/rapor');
      }).catch(() => setUyari('❌ Kayıt güncellenemedi.'));
    } else {
      kayitEkle(payload).then(res => {
        if (res.data.success) {
          ekSerileriKaydet(res.data.id);
          if (!res.data.yeni) setUyari(`⚠️ Bu bildirim no daha önce ${res.data.kac_kez} kez girildi.\n ✅ Kayıt güncellendi.`);
          else { setUyari('✅ Yeni kayıt oluşturuldu.'); clear(); }
        }
      }).catch(() => setUyari('❌ Kayıt eklenemedi, lütfen alanları kontrol edin.'));
    }
  };

  const clear = () => { setForm(emptyForm); setSureler({}); setDurum('—'); setEkSeriler([]); };

  const durumColor = durum==='İADE RET'?'#0418ca':durum==='KAPALI'?'#16a34a':durum==='AÇIK'?'#dc2626':'#888';

  return (
    <div style={{ fontFamily: FONT_FAMILY }}>
      {uyari && <div onClick={()=>setUyari('')} style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}><div style={{background:'#fff',borderRadius:'10px',padding:'1.5rem',maxWidth:'320px',textAlign:'center'}}><p style={{fontSize:'13px',marginBottom:'1rem'}}>{uyari}</p><button onClick={()=>setUyari('')} style={{padding:'6px 16px',borderRadius:'6px',border:'1px solid #ccc',background:'#f97316',color:'#fff',cursor:'pointer',fontSize:'12px',fontWeight:'700'}}>Tamam</button></div></div>}
      <h1 style={{fontSize:'17px',fontWeight:'700',marginBottom:'1rem',paddingBottom:'.6rem',borderBottom:'1px solid #ddd', fontFamily: FONT_FAMILY}}>↩ İade Kayıt Ekranı</h1>

      <div style={sectionStyle} id="bolum-kalite">
        <div style={sectionTitleStyle}>✓ Kalite</div>
        <div style={sectionBodyStyle}>
          <Field label="KAREL İŞ KOLU" field="karel_is_kolu" type="select" options={['SAVUNMA ARGE','SAVUNMA EMS','Savunma']} form={form} set={set} />
          <Field label="MÜŞTERİ" field="musteri" form={form} set={set} />
          <Field label="MÜŞTERİ BİLDİRİM NO" field="musteri_bildirim_no" type="number" form={form} set={set} />
          <Field label="BİLDİRİM TARİHİ" field="bildirim_tarihi" form={form} set={set} />
          <Field label="MÜŞTERİ STOK NO" field="musteri_stok_no" form={form} set={set} />
          <Field label="KAREL STOK NO" field="karel_stok_no" form={form} set={set} />
          <Field label="ÜRÜN TANIMI" field="urun_tanimi" form={form} set={set} />
          <Field label="PROJE" field="proje" form={form} set={set} />
          <Field label="BİLDİRİLEN SERİ NO" field="bildirilen_seri_no" form={form} set={set} />
          <div style={{gridColumn:'1/-1'}}>
            <label style={labelStyle}>EK SERİ / İŞ EMİRLERİ</label>
            {ekSeriler.map((s, idx) => (
              <div key={idx} style={{display:'flex',gap:'6px',marginBottom:'5px',alignItems:'center'}}>
                <input type="text" placeholder="Seri No" value={s.seri_no} onChange={e=>ekSeriGuncelle(idx,'seri_no',e.target.value)} style={{...inputStyle,flex:1}} />
                <input type="text" placeholder="İş Emri" value={s.is_emri} onChange={e=>ekSeriGuncelle(idx,'is_emri',e.target.value)} style={{...inputStyle,flex:1}} />
                <button type="button" onClick={()=>ekSeriSil(idx)} style={{border:'1px solid #ccc',background:'#fff',borderRadius:'6px',padding:'5px 10px',cursor:'pointer',fontSize:'12px'}}>✕</button>
              </div>
            ))}
            <button type="button" onClick={ekSeriEkle} style={{fontFamily:FONT_FAMILY,border:'1px dashed #999',background:'#fafafa',borderRadius:'6px',padding:'5px 12px',cursor:'pointer',fontSize:'12px',color:'#555'}}>+ Seri/İş Emri Ekle</button>
          </div>
          <Field label="KALİTEYE GELİŞ TARİHİ" field="kaliteye_gelis_tarihi" form={form} set={set} />
          <Field label="ÜRETİME AKTARIM TARİHİ" field="uretim_aktarim_tarihi" form={form} set={set} />
          <Field label="SEVKİYAT DEPOYA AKTARIM TARİHİ" field="sevkiyat_depoya_aktarim_tarihi" form={form} set={set} />
          <Field label="KALİTE KONTROL + 8D" field="kalite_kontrol_8d" type="select" options={['OK','NOK']} form={form} set={set} />
          <Field label="ECO/DK KONTROLÜ" field="eco_dk_kontrolu" type="select" options={['Var','Yok','Belirsiz']} form={form} set={set} />
          <Field label="KAYNAĞINDA DENETİM" field="kaynaginda_denetim" type="select" options={['Geçti','Geçmedi']} form={form} set={set} />
          <div style={{gridColumn:'1/-1'}}><Field label="MÜŞTERİ İADE NEDENİ" field="musteri_iade_nedeni" type="textarea" form={form} set={set} /></div>
          <div style={{gridColumn:'1/-1'}}><Field label="HATA TÜRÜ" field="hata_turu" type="select" options={HATA_TURLERI} form={form} set={set} /></div>
        </div>
        <div style={saveBtnRow}><button onClick={save} style={saveBtn}>💾 Kaydet</button></div>
      </div>

      <div style={sectionStyle} id="bolum-sop">
        <div style={sectionTitleStyle}>📄 Kalite - Proje (SOP)</div>
        <div style={sectionBodyStyle}>
          <Field label="MÜŞTERİ-KALİTE MUTABAKAT DURUMU" field="mutabakat_durumu" type="select" options={['İade Kabul','İade Ret']} form={form} set={set} />
          <Field label="NİHAİ GARANTİ ÜZERİNE MÜŞTERİ MUTABAKATI" field="nihai_garanti_mutabakat" type="select" options={['Var','Yok','Belirsiz']} form={form} set={set} />
          <Field label="MÜŞTERİ ONARIM MÜTABAKATI" field="musteri_onarim_mutabakat" type="select" options={['Var','Yok','Belirsiz']} form={form} set={set} />
        </div>
        <div style={saveBtnRow}><button onClick={save} style={saveBtn}>💾 Kaydet</button></div>
      </div>

      <div style={sectionStyle} id="bolum-uretimkalite">
        <div style={sectionTitleStyle}>🔧 Üretim - Kalite</div>
        <div style={sectionBodyStyle}>
          <Field label="İLK SEVKİYAT TARİHİ (GARANTİ BAŞLANGIÇ TARİHİ)" field="ilk_sevk_tarihi" form={form} set={set} />
        </div>
        <div style={saveBtnRow}><button onClick={save} style={saveBtn}>💾 Kaydet</button></div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>🛡 Formül + Proje (SOP) + Kalite + Üretim</div>
        <div style={sectionBodyStyle}>
          <Field label="GARANTİ DURUMU" field="garanti_durumu" type="select" options={['Garanti İçi','Garanti Dışı','Belirsiz']} form={form} set={set} />
        </div>
        <div style={saveBtnRow}><button onClick={save} style={saveBtn}>💾 Kaydet</button></div>
      </div>

      <div style={sectionStyle} id="bolum-planlama">
        <div style={sectionTitleStyle}>📅 Planlama</div>
        <div style={sectionBodyStyle}>
          <Field label="FATURALI / FATURASIZ" field="faturali_faturasiz" type="select" options={['Faturalı','Faturasız']} form={form} set={set} />
          <Field label="İŞ EMRİ AÇILIŞ TARİHİ" field="is_emri_acilis_tarihi" form={form} set={set} />
          <div style={{gridColumn:'1/-1'}}><Field label="İŞ EMRİ" field="is_emri" form={form} set={set} /></div>
        </div>
        <div style={saveBtnRow}><button onClick={save} style={saveBtn}>💾 Kaydet</button></div>
      </div>

      <div style={sectionStyle} id="bolum-sevkdepo">
        <div style={sectionTitleStyle}>🚚 Planlama (Sevkiyat Depo)</div>
        <div style={sectionBodyStyle}>
          <Field label="MÜŞTERİ İRSALİYE NO" field="musteri_irsaliye_no" form={form} set={set} />
          <Field label="MÜŞTERİ İRSALİYE TARİHİ" field="musteri_irsaliye_tarihi" form={form} set={set} />
          <Field label="MÜŞTERİ SİPARİŞ NO" field="musteri_siparis_no" form={form} set={set} />
          <Field label="GELEN ÜRÜN SERİ NO" field="gelen_urun_seri_no" form={form} set={set} />
          <Field label="KAREL İRSALİYE NO" field="karel_irsaliye_no" form={form} set={set} disabled={!form.musteri_irsaliye_no || !form.musteri_irsaliye_tarihi || !form.musteri_siparis_no || !form.gelen_urun_seri_no} />
          <Field label="İADE SEVK TARİHİ" field="iade_sevk_tarihi" form={form} set={set} />
        </div>
        <div style={saveBtnRow}><button onClick={save} style={saveBtn}>💾 Kaydet</button></div>
      </div>

      <div style={sectionStyle} id="bolum-uretim">
        <div style={sectionTitleStyle}>⚙ Üretim</div>
        <div style={sectionBodyStyle}>
          <Field label="HEDEFLENEN ONARIM TARİHİ" field="hedeflenen_onarim_tarihi" form={form} set={set} />
          <Field label="GERÇEKLEŞEN ONARIM TARİHİ" field="gerceklesen_onarim_tarihi" form={form} set={set} />
          <div style={{gridColumn:'1/-1'}}><Field label="ONARIM AÇIKLAMA" field="onarim_aciklama" type="textarea" form={form} set={set} /></div>
          <Field label="PROFORMA NUMARASI(GD İSE)" field="proforma_numarasi" form={form} set={set} />
          <Field label="KALİTEYE AKTARIM TARİHİ" field="kaliteye_aktarim_tarihi" form={form} set={set} />
          <Field label="ECO/DK KONTROLÜ (ÜRETİM)" field="eco_dk_kontrolu_uretim" type="select" options={['Var','Yok','Belirsiz']} form={form} set={set} />
          <Field label="HEDEFLENEN HATA TESPİT TARİHİ" field="hedeflenen_hata_tespit_tarihi" form={form} set={set} />
          <Field label="GERÇEKLEŞEN HATA TESPİT TARİHİ" field="gerceklesen_hata_tespit_tarihi" form={form} set={set} />
          <div style={{gridColumn:'1/-1'}}><Field label="ÜRETİM BULGUSU" field="uretim_bulgusu" type="textarea" form={form} set={set} /></div>
          <div style={{gridColumn:'1/-1'}}><Field label="MALZEME İHTİYAÇ PLANLAMA VE MÜŞTERİ YÖNETİMİ / MALZEME TEMİN SÖZLEŞME DURUMU" field="malzeme_planlama" form={form} set={set} /></div>
          <Field label="NFF DURUMU" field="nff_durumu" type="select" options={['Var','Yok']} form={form} set={set} />
          <Field label="NİHAİ GARANTİ DURUMU" field="nihai_garanti_durumu" type="select" options={['Garanti İçi','Garanti Dışı','Belirsiz']} form={form} set={set} />
        </div>
        <div style={saveBtnRow}><button onClick={save} style={saveBtn}>💾 Kaydet</button></div>
      </div>

      <div style={sectionStyle} id="bolum-bekleme">
        <div style={sectionTitleStyle}>◷ Üretim / Planlama</div>
        <div style={sectionBodyStyle}>
          <Field label="BEKLEME NEDENİ" field="bekleme_nedeni" type="select" options={['Müşteri','Karel']} form={form} set={set} />
        </div>
        <div style={saveBtnRow}><button onClick={save} style={saveBtn}>💾 Kaydet</button></div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>⌛ Hesaplanan Süreler ve Durum</div>
        <div style={{...sectionBodyStyle, gridTemplateColumns:'1fr 1fr 1fr'}}>
          {[['BİLDİRİM → DEPO ARASI GEÇEN SÜRE','d1'],['DEPO → İŞ EMRİ ARASI GEÇEN SÜRE','d2'],['İŞ EMRİ → KALİTE ARASI GEÇEN SÜRE','d3'],['KALİTE → ÜRETİM ARASI GEÇEN SÜRE','d4'],['ÜRETİM → KALİTE ARASI GEÇEN SÜRE','d5'],['KALİTE → SEVKİYAT DEPO ARASI GEÇEN SÜRE','d6'],['SEVKİYAT DEPO → SEVKİYAT ARASI GEÇEN SÜRE','d7'],['TOPLAM','TOPLAM']].map(([l,k]) => (
            <div key={k} style={{display:'flex',flexDirection:'column',gap:'3px', fontFamily: FONT_FAMILY}}>
              <label style={labelStyle}>{l}</label>
              <input readOnly value={sureler[k]||'—'} style={{...inputStyle,background:'#f7f7f7',color:'#555'}} />
            </div>
          ))}
          <div style={{display:'flex',flexDirection:'column',gap:'3px', fontFamily: FONT_FAMILY}}>
            <label style={labelStyle}>DURUM</label>
            <input readOnly value={durum} style={{...inputStyle,background:'#f7f7f7',fontWeight:'700',color:durumColor}} />
          </div>
        </div>
        <div style={{padding:'.6rem 1rem',borderTop:'1px solid #f0f0ee',display:'flex',justifyContent:'flex-end',gap:'8px'}}>
          <button onClick={()=>{clear(); setUyari('✅ Form temizlendi.');}} style={{fontFamily: FONT_FAMILY, padding:'6px 18px',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:'pointer',border:'1px solid #ccc',background:'#fc9a9a'}}>✕ Formu Temizle</button>
          <button onClick={save} style={saveBtn}>💾 Kaydet</button>
        </div>
      </div>
    </div>
  );
}