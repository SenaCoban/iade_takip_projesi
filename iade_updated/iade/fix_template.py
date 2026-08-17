import re

path = '/home/sena/iade_projesi/iade_app/templates/iade_formu.html'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# saveSection + saveAllRecord bloğunu bul ve değiştir
start = content.find('function saveSection(sec){')
end = content.find('\nfunction clearSection', start)

if start == -1 or end == -1:
    print("HATA: Fonksiyonlar bulunamadı!")
    exit(1)

old_block = content[start:end]

new_block = '''function saveSection(sec){
  // Kalite bölümü: her zaman YENİ kayıt oluşturur veya mevcut kaydı günceller
  // Diğer bölümler: aktif kayıt varsa günceller, yoksa uyarı verir
  if(sec === 'kalite'){
    saveKaliteSection();
  } else {
    if(!window.aktifKayitId){
      alert('Önce Kalite bölümünü kaydedin!');
      return;
    }
    saveSectionToDb(sec);
  }
}

function saveKaliteSection(){
  var data = {
    karel_is_kolu: g('k_is_kolu'),
    musteri_iade_nedeni: g('k_iade_nedeni'),
    musteri: g('k_musteri'),
    musteri_bildirim_no: g('k_bildirim_no'),
    bildirim_tarihi: g('k_bildirim_tarihi'),
    musteri_stok_no: g('k_musteri_stok'),
    karel_stok_no: g('k_karel_stok'),
    urun_tanimi: g('k_urun_tanimi'),
    proje: g('k_proje'),
    bildirilen_seri_no: g('k_seri_no'),
    kaliteye_gelis_tarihi: g('k_kalite_gelis'),
    uretim_aktarim_tarihi: g('k_uretim_aktarim'),
    sevkiyat_depoya_aktarim_tarihi: g('k_sevk_depo_aktarim'),
    kalite_kontrol_8d: g('k_8d'),
    eco_dk_kontrolu: g('k_eco'),
    kaynaginda_denetim: g('k_denetim'),
    hata_turu: g('k_hata_turu'),
    durum: 'Açık'
  };

  if(!data.musteri_bildirim_no && !data.musteri){
    alert('En az Müşteri veya Bildirim No giriniz!');
    return;
  }

  if(window.aktifKayitId){
    // Mevcut kaydı güncelle
    fetch('/api/kayit/' + window.aktifKayitId + '/guncelle/', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    })
    .then(function(r){ return r.json(); })
    .then(function(res){
      if(res.success){
        alert('Kalite bölümü güncellendi.');
      } else {
        alert('Hata: ' + res.error);
      }
    });
  } else {
    // Yeni kayıt oluştur
    fetch('/api/kayit/ekle/', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    })
    .then(function(r){ return r.json(); })
    .then(function(res){
      if(res.success){
        window.aktifKayitId = res.id;
        alert('Kalite bölümü kaydedildi. Kayıt ID: ' + res.id);
        // Sayfa başlığına aktif kayıt ID'sini göster
        var h2 = document.querySelector('#tab-kayit h2');
        if(h2) h2.textContent = '↩ İade Kayıt Ekranı  [Aktif Kayıt #' + res.id + ']';
      } else {
        alert('Hata: ' + res.error);
      }
    });
  }
}

function saveSectionToDb(sec){
  var fieldMap = {
    sop: {
      mutabakat_durumu: g('k_mutabakat'),
      nihai_garanti_mutabakat: g('k_nihai_mutabakat'),
      musteri_onarim_mutabakat: g('k_onarim_mutabakat')
    },
    uretimkalite: {
      ilk_sevk_tarihi: g('k_ilk_sevk')
    },
    formul: {
      garanti_durumu: g('k_garanti')
    },
    planlama: {
      faturali_faturasiz: g('k_fatura'),
      is_emri_acilis_tarihi: g('k_is_emri_acilis'),
      is_emri: g('k_is_emri')
    },
    sevkdepo: {
      musteri_irsaliye_no: g('k_irsaliye_no'),
      musteri_irsaliye_tarihi: g('k_irsaliye_tarihi'),
      musteri_siparis_no: g('k_siparis_no'),
      gelen_urun_seri_no: g('k_gelen_seri'),
      karel_irsaliye_no: g('k_karel_irsaliye'),
      iade_sevk_tarihi: g('k_iade_sevk_tarihi')
    },
    uretim: {
      hedeflenen_onarim_tarihi: g('k_hdef_onarim'),
      gerceklesen_onarim_tarihi: g('k_grc_onarim'),
      onarim_aciklama: g('k_onarim_aciklama'),
      proforma_numarasi: g('k_proforma'),
      kaliteye_aktarim_tarihi: g('k_kaliteye_aktarim'),
      eco_dk_kontrolu_uretim: g('k_eco_uretim'),
      hedeflenen_hata_tespit_tarihi: g('k_hdef_hata'),
      gerceklesen_hata_tespit_tarihi: g('k_grc_hata'),
      uretim_bulgusu: g('k_uretim_bulgusu'),
      malzeme_planlama: g('k_malzeme_planlama'),
      nff_durumu: g('k_nff'),
      nihai_garanti_durumu: g('k_nihai_garanti')
    },
    bekleme: {
      bekleme_nedeni: g('k_bekleme')
    }
  };

  var data = fieldMap[sec];
  if(!data){ alert('Bilinmeyen bölüm: ' + sec); return; }

  // Durum hesapla (sevkdepo bölümünde iade_sevk_tarihi doluysa Kapalı)
  if(sec === 'sevkdepo' || sec === 'sop'){
    var mut = g('k_mutabakat');
    var isv = g('k_iade_sevk_tarihi') || '';
    if(mut === 'İade Ret') data.durum = 'İade Ret';
    else if(mut === 'İade Kabul') data.durum = isv ? 'Kapalı' : 'Açık';
  }

  fetch('/api/kayit/' + window.aktifKayitId + '/guncelle/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  })
  .then(function(r){ return r.json(); })
  .then(function(res){
    if(res.success){
      alert(sec + ' bölümü kaydedildi.');
    } else {
      alert('Hata: ' + res.error);
    }
  })
  .catch(function(e){ alert('Bağlantı hatası: ' + e); });
}

function saveAllRecord(){
  if(!window.aktifKayitId){
    alert('Önce Kalite bölümünü kaydedin!');
    return;
  }
  // Tüm bölümleri sırayla kaydet
  ['sop','uretimkalite','formul','planlama','sevkdepo','uretim','bekleme'].forEach(function(sec){
    saveSectionToDb(sec);
  });
}

function yeniKayitBaslat(){
  window.aktifKayitId = null;
  var h2 = document.querySelector('#tab-kayit h2');
  if(h2) h2.textContent = '↩ İade Kayıt Ekranı';
  ['kalite','sop','uretimkalite','formul','planlama','sevkdepo','uretim','bekleme'].forEach(function(sec){
    clearSection(sec);
  });
}

'''

content = content[:start] + new_block + content[end:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Başarıyla güncellendi!")
