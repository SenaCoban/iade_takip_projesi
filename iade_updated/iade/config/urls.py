from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from iade_app import views

urlpatterns = [
    #path('', views.iade_formu, name='iade_formu'),
    path('login/', views.login_view, name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='/login/'), name='logout'),
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
    path('admin/', admin.site.urls),
    path('', include('iade_app.urls')),
    path('api/iskolu/', views.iskolu_getir),
]
