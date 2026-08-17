import sqlite3

baglanti = sqlite3.connect('proje.db')
imlec = baglanti.cursor()

# 1. Veri Ekleme
imlec.execute("INSERT INTO Musteriler (Ad, Soyad, Telefon) VALUES (?, ?, ?)", ("Sena", "Çoban", "05550000000"))
baglanti.commit()
print("Kayıt eklendi!")

# 2. Verileri Okuma
imlec.execute("SELECT * FROM Musteriler")
tum_veriler = imlec.fetchall()

print("Veritabanındaki kayıtlar:")
for veri in tum_veriler:
    print(veri)

baglanti.close()