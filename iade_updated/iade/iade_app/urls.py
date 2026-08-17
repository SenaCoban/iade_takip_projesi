from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('api/test-login/', views.test_login, name='test_login'),  # BUNU EKLE
    path('api/kayitlar/', views.kayit_listele, name='kayit_listele'),
    path('api/kayit/ekle/', views.kayit_ekle, name='kayit_ekle'),
    path('api/kayit/<int:kayit_id>/guncelle/', views.kayit_guncelle, name='kayit_guncelle'),
    path('api/kayit/<int:kayit_id>/sil/', views.kayit_sil, name='kayit_sil'),
    path('api/kullanicilar/', views.kullanici_listele, name='kullanici_listele'),
    path('api/kullanicilar/kaydet/', views.kullanici_kaydet, name='kullanici_kaydet'),
    path('api/kullanici/rol/', views.kullanici_rol, name='kullanici_rol'),
    path('api/kullanici/<int:kullanici_id>/sil/', views.kullanici_sil, name='kullanici_sil'),
    path('api/kullanici/cop/', views.kullanici_cop_listele, name='kullanici_cop_listele'),
    path('api/kullanici/cop/<int:kayit_id>/geri/', views.kullanici_cop_geri_yukle, name='kullanici_cop_geri_yukle'),
    path('api/kullanici/cop/<int:kayit_id>/kalici-sil/', views.kullanici_cop_kalici_sil, name='kullanici_cop_kalici_sil'),
    path('api/cop/', views.cop_listele, name='cop_listele'),
    path('api/cop/<int:kayit_id>/geri/', views.cop_geri_yukle, name='cop_geri_yukle'),
    path('api/cop/<int:kayit_id>/kalici-sil/', views.cop_kalici_sil, name='cop_kalici_sil'),
    path('api/iade-listesi/', views.iade_listesi, name='iade_listesi'),
    path('api/kayit/<int:kayit_id>/seriler/', views.seri_listele, name='seri_listele'),
    path('api/kayit/<int:kayit_id>/seri/ekle/', views.seri_ekle, name='seri_ekle'),
    path('api/seri/<int:seri_id>/guncelle/', views.seri_guncelle, name='seri_guncelle'),
    path('api/seri/<int:seri_id>/sil/', views.seri_sil, name='seri_sil'),
    path('api/musteri-stok-no-bilgi/', views.musteri_stok_no_bilgi, name='musteri_stok_no_bilgi'),
]