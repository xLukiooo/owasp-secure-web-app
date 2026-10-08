FROM python:3.12-slim

# Ustaw zmienną, aby Python nie buforował wyjścia
ENV PYTHONUNBUFFERED=1

# Katalog roboczy wewnątrz kontenera
WORKDIR /app

# Aktualizuj system i zainstaluj netcat-openbsd (nc) oraz klienta MySQL
RUN apt-get update \
 && apt-get install -y \
      netcat-openbsd \
      default-mysql-client \
 && rm -rf /var/lib/apt/lists/*

# Skopiuj plik requirements.txt i zainstaluj zależności
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Skopiuj cały kod aplikacji Django
COPY . /app/

# Otwórz port 8000
EXPOSE 8000

# Domyślne polecenie: czekaj na DB, migracje, potem Gunicorn
CMD sh -c "\
    while ! nc -z db 3306; do echo 'Waiting for MySQL...'; sleep 2; done && \
    python manage.py migrate && \
    gunicorn myproject.wsgi:application --bind 0.0.0.0:8000 \
      --access-logfile - \
      --access-logformat '%(t)s \"%(r)s\" %(s)s %(b)s in %(L)s'\
"
