# https://hub.docker.com/_/django/
FROM python:3.9.17-alpine
COPY ["requirements.txt", "./"]
RUN pip install -r requirements.txt
COPY ["./api/", "./api/"]
COPY ["./manage.py", ".pg_service.conf", ".my_pgpass", "./"]
COPY ["./core/", "./core/"]
COPY ["./static/", "./static/"]
COPY ["db.sqlite3", "./"]
RUN mkdir -p ./frontend/dist/
COPY ["./frontend/dist/", "./frontend/dist/"]
EXPOSE 8000
ENV PYTHONPATH "${PYTHONPATH}:/"
CMD python manage.py runserver 0.0.0.0:8000
