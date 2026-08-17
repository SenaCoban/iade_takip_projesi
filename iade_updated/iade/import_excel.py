import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import openpyxl
from datetime import datetime
from iade_app.models import IadeKayit

wb = openpyxl.load_workbook(r'C:\Users\sena.coban.KAREL\Downloads\İADE_TAKİP_FORMU_duzeltilmis.xlsx', data_only=True)
ws = wb.active

def fmt_date(val):
    if not val:
        return ''
    if hasattr(val, 'strftime'):
        return val.strftime('%d.%m.%Y')
    if isinstance(val, (int, float)):
        try:
            d = datetime.fromordinal(datetime(1900,1,1).toordinal() + int(val) - 2)
            return d.strftime('%d.%m.%Y')
        except:
            return ''
    s = str(val).strip()
    if '-' in s and len(s) >= 10:
        try:
            d = datetime.strptime(s[:10], '%Y-%m-%d')
            return d.strftime('%d.%m.%Y')
        except:
            pass
    return s

def fmt(val):
    if val is None:
        return ''
    return str(val).strip()

count = 0
errors = 0
for row in ws.iter_rows(min_row=4, values_only=True):
    if not any(row):
        continue
    if not row[0] and not row[1] and not row[2]:
        continue
    try:
        IadeKayit.objects.create(
            karel_is_kolu=fmt(row[0]),
            musteri=fmt(row[1]),
            musteri_bildirim_no=fmt(row[2]),
            bildirim_tarihi=fmt_date(row[3]),
            musteri_stok_no=fmt(row[4]),
            karel_stok_no=fmt(row[5]),
            urun_tanimi=fmt(row[6]),
            proje=fmt(row[7]),
            bildirilen_seri_no=fmt(row[8]),
            mutabakat_durumu=fmt(row[9]),
            ilk_sevk_tarihi=fmt_date(row[10]),
            garanti_durumu=fmt(row[11]),
            faturali_faturasiz=fmt(row[12]),
            musteri_iade_nedeni=fmt(row[13]),
            musteri_irsaliye_no=fmt(row[15]),
            musteri_irsaliye_tarihi=fmt_date(row[16]),
            musteri_siparis_no=fmt(row[17]),
            gelen_urun_seri_no=fmt(row[18]),
            is_emri=fmt(row[19]),
            is_emri_acilis_tarihi=fmt_date(row[20]),
            kaliteye_gelis_tarihi=fmt_date(row[21]),
            hata_turu=fmt(row[22]),
            uretim_aktarim_tarihi=fmt_date(row[23]),
            hedeflenen_hata_tespit_tarihi=fmt_date(row[24]),
            gerceklesen_hata_tespit_tarihi=fmt_date(row[25]),
            nff_durumu=fmt(row[26]),
            uretim_bulgusu=fmt(row[27]),
            malzeme_planlama=fmt(row[28]),
            nihai_garanti_durumu=fmt(row[29]),
            nihai_garanti_mutabakat=fmt(row[30]),
            musteri_onarim_mutabakat=fmt(row[31]),
            eco_dk_kontrolu=fmt(row[32]),
            hedeflenen_onarim_tarihi=fmt_date(row[33]),
            gerceklesen_onarim_tarihi=fmt_date(row[34]),
            onarim_aciklama=fmt(row[35]),
            proforma_numarasi=fmt(row[36]),
            kaliteye_aktarim_tarihi=fmt_date(row[37]),
            kalite_kontrol_8d=fmt(row[38]),
            eco_dk_kontrolu_uretim=fmt(row[39]),
            kaynaginda_denetim=fmt(row[40]),
            sevkiyat_depoya_aktarim_tarihi=fmt_date(row[41]),
            karel_irsaliye_no=fmt(row[42]),
            iade_sevk_tarihi=fmt_date(row[43]),
            bekleme_nedeni=fmt(row[52]) if len(row) > 52 else '',
            durum=fmt(row[53]) if len(row) > 53 else '',
        )
        count += 1
    except Exception as e:
        errors += 1
        if errors <= 3:
            print(f"HATA: {e}")

print(f"Aktarıldı: {count}, Hata: {errors}")
