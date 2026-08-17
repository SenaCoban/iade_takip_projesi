# 1. Temel imajı belirle
FROM python:3.12-slim

# 2. Sistem bağımlılıklarını kur (gcc ve LDAP için gerekli kütüphaneler)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libldap2-dev \
    libsasl2-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# 3. Ortam değişkenlerini ayarla
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 4. Çalışma dizinini oluştur
WORKDIR /app

# 5. Gereksinimleri kopyala ve kur
COPY requirements.txt .
RUN pip install --no-cache-dir \
    --trusted-host pypi.org \
    --trusted-host files.pythonhosted.org \
    --trusted-host pypi.python.org \
    -r requirements.txt
    
# 6. Proje dosyalarını kopyala
COPY . .

# 7. Uygulamayı başlat
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]