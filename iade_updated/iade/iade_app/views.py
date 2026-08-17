import json
import oracledb
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login as auth_login
from .models import IadeKayit, Kullanici, IadeKayitGecmis, IadeKayitSilindi, KullaniciSilindi, IadeSeriKalem

def iade_formu(request):
    rol = ""
    print(f"Giriş yapan kullanıcı: {request.user.username}") # Terminalde kontrol edin
    try:
        k = Kullanici.objects.get(kullanici_adi=request.user.username)
        rol = k.roller
        print(f"Bulunan rol: {rol}")
    except Kullanici.DoesNotExist:
        print("Kullanıcı veritabanında bulunamadı!")
        pass
    return render(request, 'iade_formu.html', {'kullanici_rol': rol, 'kullanici_adi': request.user.username})


def kayit_listele(request):
    iskolu = request.GET.get('iskolu') # Frontend'den gelecek parametre
    if iskolu:
        kayitlar = IadeKayit.objects.filter(karel_is_kolu=iskolu).values()
    else:
        kayitlar = IadeKayit.objects.all().values()
    return JsonResponse(list(kayitlar), safe=False)

@csrf_exempt
@require_http_methods(["POST"])
def kayit_ekle(request):
    try:
        data = json.loads(request.body)
        bildirim_no = data.get('musteri_bildirim_no', '')
        fields = {
            'karel_is_kolu': data.get('karel_is_kolu', ''),
            'musteri': data.get('musteri', ''),
            'musteri_iade_nedeni': data.get('musteri_iade_nedeni', ''),
            'bildirim_tarihi': data.get('bildirim_tarihi', ''),
            'musteri_stok_no': data.get('musteri_stok_no', ''),
            'karel_stok_no': data.get('karel_stok_no', ''),
            'urun_tanimi': data.get('urun_tanimi', ''),
            'proje': data.get('proje', ''),
            'bildirilen_seri_no': data.get('bildirilen_seri_no', ''),
            'kaliteye_gelis_tarihi': data.get('kaliteye_gelis_tarihi', ''),
            'uretim_aktarim_tarihi': data.get('uretim_aktarim_tarihi', ''),
            'sevkiyat_depoya_aktarim_tarihi': data.get('sevkiyat_depoya_aktarim_tarihi', ''),
            'kalite_kontrol_8d': data.get('kalite_kontrol_8d', ''),
            'eco_dk_kontrolu': data.get('eco_dk_kontrolu', ''),
            'kaynaginda_denetim': data.get('kaynaginda_denetim', ''),
            'hata_turu': data.get('hata_turu', ''),
            'mutabakat_durumu': data.get('mutabakat_durumu', ''),
            'nihai_garanti_mutabakat': data.get('nihai_garanti_mutabakat', ''),
            'musteri_onarim_mutabakat': data.get('musteri_onarim_mutabakat', ''),
            'ilk_sevk_tarihi': data.get('ilk_sevk_tarihi', ''),
            'garanti_durumu': data.get('garanti_durumu', ''),
            'faturali_faturasiz': data.get('faturali_faturasiz', ''),
            'is_emri_acilis_tarihi': data.get('is_emri_acilis_tarihi', ''),
            'is_emri': data.get('is_emri', ''),
            'musteri_irsaliye_no': data.get('musteri_irsaliye_no', ''),
            'musteri_irsaliye_tarihi': data.get('musteri_irsaliye_tarihi', ''),
            'musteri_siparis_no': data.get('musteri_siparis_no', ''),
            'gelen_urun_seri_no': data.get('gelen_urun_seri_no', ''),
            'karel_irsaliye_no': data.get('karel_irsaliye_no', ''),
            'iade_sevk_tarihi': data.get('iade_sevk_tarihi', ''),
            'hedeflenen_onarim_tarihi': data.get('hedeflenen_onarim_tarihi', ''),
            'gerceklesen_onarim_tarihi': data.get('gerceklesen_onarim_tarihi', ''),
            'onarim_aciklama': data.get('onarim_aciklama', ''),
            'proforma_numarasi': data.get('proforma_numarasi', ''),
            'kaliteye_aktarim_tarihi': data.get('kaliteye_aktarim_tarihi', ''),
            'eco_dk_kontrolu_uretim': data.get('eco_dk_kontrolu_uretim', ''),
            'hedeflenen_hata_tespit_tarihi': data.get('hedeflenen_hata_tespit_tarihi', ''),
            'gerceklesen_hata_tespit_tarihi': data.get('gerceklesen_hata_tespit_tarihi', ''),
            'uretim_bulgusu': data.get('uretim_bulgusu', ''),
            'malzeme_planlama': data.get('malzeme_planlama', ''),
            'nff_durumu': data.get('nff_durumu', ''),
            'nihai_garanti_durumu': data.get('nihai_garanti_durumu', ''),
            'bekleme_nedeni': data.get('bekleme_nedeni', ''),
            'durum': data.get('durum', ''),
        }
        try:
            kayit = IadeKayit.objects.get(musteri_bildirim_no=bildirim_no)
            eski_veri = {f.name: str(getattr(kayit, f.name)) for f in kayit._meta.fields if f.name not in ['olusturma_tarihi', 'guncelleme_tarihi']}
            IadeKayitGecmis.objects.create(ana_kayit=kayit, eski_veri=eski_veri)
            gecmis_sayisi = IadeKayitGecmis.objects.filter(ana_kayit=kayit).count()
            for field, value in fields.items():
                setattr(kayit, field, value)
            kayit.save()
            return JsonResponse({'success': True, 'id': kayit.id, 'message': 'Kayıt güncellendi', 'yeni': False, 'kac_kez': gecmis_sayisi})
        except IadeKayit.DoesNotExist:
            kayit = IadeKayit.objects.create(musteri_bildirim_no=bildirim_no, **fields)
            return JsonResponse({'success': True, 'id': kayit.id, 'message': 'Yeni kayıt oluşturuldu', 'yeni': True, 'kac_kez': 1})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def kayit_guncelle(request, kayit_id):
    try:
        kayit = IadeKayit.objects.get(id=kayit_id)
        eski_veri = {f.name: str(getattr(kayit, f.name)) for f in kayit._meta.fields if f.name not in ['olusturma_tarihi', 'guncelleme_tarihi']}
        IadeKayitGecmis.objects.create(ana_kayit=kayit, eski_veri=eski_veri)
        data = json.loads(request.body)
        for field, value in data.items():
            if hasattr(kayit, field):
                setattr(kayit, field, value)
        kayit.save()
        return JsonResponse({'success': True})
    except IadeKayit.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Kayıt bulunamadı'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def kayit_sil(request, kayit_id):
    try:
        kayit = IadeKayit.objects.get(id=kayit_id)
        veri = {f.name: str(getattr(kayit, f.name)) for f in kayit._meta.fields}
        IadeKayitSilindi.objects.create(
            kayit_verisi=veri,
            silen_kullanici=request.session.get('username', request.user.username if request.user.is_authenticated else '')
        )
        kayit.delete()
        return JsonResponse({'success': True})
    except IadeKayit.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Kayıt bulunamadı'}, status=404)

@csrf_exempt
def cop_listele(request):
    kayitlar = IadeKayitSilindi.objects.all().values()
    return JsonResponse(list(kayitlar), safe=False)

@csrf_exempt
@require_http_methods(["POST"])
def cop_geri_yukle(request, kayit_id):
    try:
        silindi = IadeKayitSilindi.objects.get(id=kayit_id)
        veri = silindi.kayit_verisi
        veri.pop('id', None)
        veri.pop('olusturma_tarihi', None)
        veri.pop('guncelleme_tarihi', None)
        kayit = IadeKayit.objects.create(**veri)
        silindi.delete()
        return JsonResponse({'success': True, 'id': kayit.id})
    except IadeKayitSilindi.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Kayıt bulunamadı'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def cop_kalici_sil(request, kayit_id):
    try:
        silindi = IadeKayitSilindi.objects.get(id=kayit_id)
        silindi.delete()
        return JsonResponse({'success': True})
    except IadeKayitSilindi.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Kayıt bulunamadı'}, status=404)

@csrf_exempt
def kullanici_listele(request):
    kullanicilar = Kullanici.objects.all().values('id', 'kullanici_adi', 'roller', 'aktif')
    return JsonResponse(list(kullanicilar), safe=False)

@csrf_exempt
@require_http_methods(["POST"])
def kullanici_kaydet(request):
    try:
        data = json.loads(request.body)
        kullanicilar = data.get('kullanicilar', [])
        Kullanici.objects.all().delete()
        for k in kullanicilar:
            if k.get('kullanici_adi', '').strip():
                Kullanici.objects.create(
                    kullanici_adi=k['kullanici_adi'].strip(),
                    roller=k.get('roller', ''),
                    aktif=k.get('aktif', True)
                )
        return JsonResponse({'success': True})
    except Exception as e:
        print(f"Hata: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

#@login_required
# @login_required  # BU SATIRI YORUM YAP
def kullanici_rol(request):
    username = request.user.username if request.user.is_authenticated else None
    if username:
        try:
            k = Kullanici.objects.get(kullanici_adi=username)
            roller = k.roller.split(',') if k.roller else []
        except Kullanici.DoesNotExist:
            roller = ['admin'] if request.user.is_superuser else []
    else:
        roller = []
        username = None
    return JsonResponse({'username': username, 'roller': roller, 'is_admin': request.user.is_superuser if request.user.is_authenticated else False})

# ============= YENİ LOGIN VIEW =============
@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    try:
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            try:
                k = Kullanici.objects.get(kullanici_adi=username)
                if not k.aktif:
                    return JsonResponse({'success': False, 'error': 'Erişim izniniz yok.'}, status=403)
            except Kullanici.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Erişim izniniz yok.'}, status=403)
            auth_login(request, user)
            request.session.save()
            return JsonResponse({'success': True, 'message': 'Giriş başarılı'})
        else:
            return JsonResponse({'success': False, 'error': 'Kullanıcı adı veya şifre hatalı'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)
    
@csrf_exempt
@require_http_methods(["POST"])
def test_login(request):
    import json
    try:
        body = json.loads(request.body)
        username = body.get('username')
        password = body.get('password')
        print(f"Test login - Username: {username}, Password: {password}")
        return JsonResponse({'status': 'ok', 'received': {'username': username, 'password': password}})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
    
@csrf_exempt
@require_http_methods(["POST"])
def kullanici_sil(request, kullanici_id):
    try:
        k = Kullanici.objects.get(id=kullanici_id)
        KullaniciSilindi.objects.create(
            kullanici_adi=k.kullanici_adi, roller=k.roller,
            silen_kullanici=request.session.get('username', request.user.username if request.user.is_authenticated else '')
        )
        k.delete()
        return JsonResponse({'success': True})
    except Kullanici.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Kullanıcı bulunamadı'}, status=404)

@csrf_exempt
def kullanici_cop_listele(request):
    return JsonResponse(list(KullaniciSilindi.objects.all().values()), safe=False)

@csrf_exempt
@require_http_methods(["POST"])
def kullanici_cop_geri_yukle(request, kayit_id):
    try:
        s = KullaniciSilindi.objects.get(id=kayit_id)
        Kullanici.objects.create(kullanici_adi=s.kullanici_adi, roller=s.roller)
        s.delete()
        return JsonResponse({'success': True})
    except KullaniciSilindi.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Kayıt bulunamadı'}, status=404)

@csrf_exempt
@require_http_methods(["POST"])
def kullanici_cop_kalici_sil(request, kayit_id):
    try:
        KullaniciSilindi.objects.get(id=kayit_id).delete()
        return JsonResponse({'success': True})
    except KullaniciSilindi.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Kayıt bulunamadı'}, status=404)
    
def iade_listesi(request):
    # Veritabanındaki tüm kayıtları çek
    kayitlar = list(IadeKayit.objects.values())
    return JsonResponse(kayitlar, safe=False)

@csrf_exempt
def iskolu_getir(request):
    karel_stok_no = request.GET.get('karel_stok_no', '')
    if not karel_stok_no:
        return JsonResponse({'iskolu': ''})
    try:
        conn = oracledb.connect(user='APEX_KAREL', password='Ora!123', host='192.168.200.91', port=1521, service_name='apxtest')
        cursor = conn.cursor()
        result_cursor = conn.cursor()
        cursor.callproc('get_kalem_by_iskolu', [karel_stok_no, result_cursor])
        row = result_cursor.fetchone()
        conn.close()
        if row:
            return JsonResponse({'iskolu': row[2], 'kalem_tanim': row[1]})
        else:
            return JsonResponse({'iskolu': '', 'kalem_tanim': ''})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

# ============= 3/7. MADDE: BİR BİLDİRİMDE BİRDEN FAZLA SERİ / İŞ EMRİ =============

@csrf_exempt
def seri_listele(request, kayit_id):
    """Bir bildirime bağlı ek serileri/iş emirlerini listeler."""
    try:
        kayitlar = IadeSeriKalem.objects.filter(ana_kayit_id=kayit_id).values()
        return JsonResponse(list(kayitlar), safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def seri_ekle(request, kayit_id):
    """Bir bildirime yeni bir seri/iş emri satırı ekler."""
    try:
        kayit = IadeKayit.objects.get(id=kayit_id)
        data = json.loads(request.body)
        satir = IadeSeriKalem.objects.create(
            ana_kayit=kayit,
            seri_no=data.get('seri_no', ''),
            is_emri=data.get('is_emri', ''),
            durum=data.get('durum', ''),
        )
        return JsonResponse({'success': True, 'id': satir.id})
    except IadeKayit.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Kayıt bulunamadı'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def seri_guncelle(request, seri_id):
    """Bir ek seri/iş emri satırını günceller."""
    try:
        satir = IadeSeriKalem.objects.get(id=seri_id)
        data = json.loads(request.body)
        for field in ('seri_no', 'is_emri', 'durum'):
            if field in data:
                setattr(satir, field, data[field])
        satir.save()
        return JsonResponse({'success': True})
    except IadeSeriKalem.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Kayıt bulunamadı'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def seri_sil(request, seri_id):
    """Bir ek seri/iş emri satırını siler."""
    try:
        IadeSeriKalem.objects.get(id=seri_id).delete()
        return JsonResponse({'success': True})
    except IadeSeriKalem.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Kayıt bulunamadı'}, status=404)


# ============= 5. MADDE: MÜŞTERİ STOK NO'DAN OTOMATİK BİLGİ ÇEKME =============

@csrf_exempt
def musteri_stok_no_bilgi(request):
    """Girilen Müşteri Stok No ile daha önce girilmiş en güncel kaydı bulup
    Karel Stok No, Proje ve Ürün Tanımı bilgilerini döner."""
    musteri_stok_no = request.GET.get('musteri_stok_no', '').strip()
    if not musteri_stok_no:
        return JsonResponse({'bulundu': False})
    kayit = IadeKayit.objects.filter(musteri_stok_no=musteri_stok_no).exclude(karel_stok_no='').order_by('-olusturma_tarihi').first()
    if not kayit:
        return JsonResponse({'bulundu': False})
    return JsonResponse({
        'bulundu': True,
        'karel_stok_no': kayit.karel_stok_no,
        'proje': kayit.proje,
        'urun_tanimi': kayit.urun_tanimi,
    })