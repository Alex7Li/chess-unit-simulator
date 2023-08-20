# https://hub.docker.com/_/django/
FROM python:3.9.17
COPY ["requirements.txt", "./"]
RUN apt-get update
RUN pip install -r requirements.txt
COPY ["./api/", "./api/"]
COPY ["./manage.py", ".pg_service.conf", "./"]
COPY ["./core/", "./core/"]
COPY ["./static/", "./static/"]
RUN mkdir -p ./frontend/dist/
COPY ["./frontend/dist/", "./frontend/dist/"]
COPY [".env", "./.env"]
EXPOSE 8000
# TODO where is manage.py
ENV PYTHONPATH "${PYTHONPATH}:/"
# RUN python manage.py makemigrations
# RUN python manage.py migrate
RUN apt-get install redis-server -y
CMD python manage.py runserver 0.0.0.0:8000
