from django.db import models

class IadeKayit(models.Model):
    # KALİTE
    karel_is_kolu = models.CharField(max_length=100, blank=True)
    musteri_iade_nedeni = models.CharField(max_length=500, blank=True)
    musteri = models.CharField(max_length=200, blank=True)
    musteri_bildirim_no = models.CharField(max_length=100, blank=True)
    bildirim_tarihi = models.CharField(max_length=20, blank=True)
    musteri_stok_no = models.CharField(max_length=100, blank=True)
    karel_stok_no = models.CharField(max_length=100, blank=True)
    urun_tanimi = models.CharField(max_length=200, blank=True)
    proje = models.CharField(max_length=100, blank=True)
    bildirilen_seri_no = models.CharField(max_length=100, blank=True)
    kaliteye_gelis_tarihi = models.CharField(max_length=20, blank=True)
    uretim_aktarim_tarihi = models.CharField(max_length=20, blank=True)
    sevkiyat_depoya_aktarim_tarihi = models.CharField(max_length=20, blank=True)
    kalite_kontrol_8d = models.CharField(max_length=20, blank=True)
    eco_dk_kontrolu = models.CharField(max_length=20, blank=True)
    kaynaginda_denetim = models.CharField(max_length=20, blank=True)
    hata_turu = models.CharField(max_length=200, blank=True)

    # KALİTE - PROJE SOP
    mutabakat_durumu = models.CharField(max_length=50, blank=True)
    nihai_garanti_mutabakat = models.CharField(max_length=20, blank=True)
    musteri_onarim_mutabakat = models.CharField(max_length=20, blank=True)

    # ÜRETİM - KALİTE
    ilk_sevk_tarihi = models.CharField(max_length=20, blank=True)

    # FORMÜL + PROJE
    garanti_durumu = models.CharField(max_length=50, blank=True)

    # PLANLAMA
    faturali_faturasiz = models.CharField(max_length=20, blank=True)
    is_emri_acilis_tarihi = models.CharField(max_length=20, blank=True)
    is_emri = models.CharField(max_length=100, blank=True)

    # PLANLAMA SEVKİYAT DEPO
    musteri_irsaliye_no = models.CharField(max_length=100, blank=True)
    musteri_irsaliye_tarihi = models.CharField(max_length=20, blank=True)
    musteri_siparis_no = models.CharField(max_length=100, blank=True)
    gelen_urun_seri_no = models.CharField(max_length=100, blank=True)
    karel_irsaliye_no = models.CharField(max_length=100, blank=True)
    iade_sevk_tarihi = models.CharField(max_length=20, blank=True)

    # ÜRETİM
    hedeflenen_onarim_tarihi = models.CharField(max_length=20, blank=True)
    gerceklesen_onarim_tarihi = models.CharField(max_length=20, blank=True)
    onarim_aciklama = models.TextField(blank=True)
    proforma_numarasi = models.CharField(max_length=100, blank=True)
    kaliteye_aktarim_tarihi = models.CharField(max_length=20, blank=True)
    eco_dk_kontrolu_uretim = models.CharField(max_length=20, blank=True)
    hedeflenen_hata_tespit_tarihi = models.CharField(max_length=20, blank=True)
    gerceklesen_hata_tespit_tarihi = models.CharField(max_length=20, blank=True)
    uretim_bulgusu = models.TextField(blank=True)
    malzeme_planlama = models.CharField(max_length=500, blank=True)
    nff_durumu = models.CharField(max_length=20, blank=True)
    nihai_garanti_durumu = models.CharField(max_length=50, blank=True)

    # ÜRETİM / PLANLAMA
    bekleme_nedeni = models.CharField(max_length=50, blank=True)

    # HESAPLANAN / OTOMATİK
    durum = models.CharField(max_length=50, blank=True)
    olusturma_tarihi = models.DateTimeField(auto_now_add=True)
    guncelleme_tarihi = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.musteri_bildirim_no} - {self.musteri}"

    class Meta:
        ordering = ['-olusturma_tarihi']


class IadeSeriKalem(models.Model):
    """Bir bildirimde/irsaliyede birden fazla seri veya iş emri olabilmesi için.
    İlk seri/iş emri IadeKayit üzerindeki mevcut alanlarda kalmaya devam eder
    (geriye dönük uyum); ek olanlar burada tutulur."""
    ana_kayit = models.ForeignKey(IadeKayit, on_delete=models.CASCADE, related_name='ek_seriler')
    seri_no = models.CharField(max_length=100, blank=True)
    is_emri = models.CharField(max_length=100, blank=True)
    durum = models.CharField(max_length=50, blank=True)  # test/iade alanı vb. (MOM entegrasyonu için)
    olusturma_tarihi = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.ana_kayit.musteri_bildirim_no} - {self.seri_no}"

    class Meta:
        ordering = ['id']
        verbose_name = 'Ek Seri/Kalem'
        verbose_name_plural = 'Ek Seri/Kalemler'


class Kullanici(models.Model):
    kullanici_adi = models.CharField(max_length=150, unique=True)
    roller = models.CharField(max_length=500, blank=True) # "Kalite,Planlama" gibi
    is_admin = models.BooleanField(default=False) # Admin yetkisi ekledik
    aktif = models.BooleanField(default=True)

    def __str__(self):
        return self.kullanici_adi

    class Meta:
        verbose_name = 'Kullanıcı'
        verbose_name_plural = 'Kullanıcılar'

class IadeKayitGecmis(models.Model):
    ana_kayit = models.ForeignKey(IadeKayit, on_delete=models.CASCADE, related_name='gecmis')
    degistiren = models.CharField(max_length=100, blank=True)
    degisiklik_tarihi = models.DateTimeField(auto_now_add=True)
    eski_veri = models.JSONField()

    def __str__(self):
        return f"{self.ana_kayit} - {self.degisiklik_tarihi}"

    class Meta:
        ordering = ['-degisiklik_tarihi']

class IadeKayitSilindi(models.Model):
    kayit_verisi = models.JSONField()
    silen_kullanici = models.CharField(max_length=100, blank=True)
    silinme_tarihi = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Silindi: {self.silinme_tarihi}"

    class Meta:
        ordering = ['-silinme_tarihi']
        verbose_name = 'Silinen Kayıt'
        verbose_name_plural = 'Silinen Kayıtlar'


class KullaniciSilindi(models.Model):
    kullanici_adi = models.CharField(max_length=150)
    roller = models.CharField(max_length=255, blank=True, default='')
    silinme_tarihi = models.DateTimeField(auto_now_add=True)
    silen_kullanici = models.CharField(max_length=150, blank=True, default='')

    def __str__(self):
        return self.kullanici_adi

    class Meta:
        ordering = ['-silinme_tarihi']
        verbose_name = 'Silinen Kullanıcı'
        verbose_name_plural = 'Silinen Kullanıcılar'