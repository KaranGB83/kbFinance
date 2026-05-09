FROM python:3.12-slim

# to prevent .pvc files and enable stdout and stderr to be sent straight away
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /usr/src/app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# COPY Project
COPY . /usr/src/app

EXPOSE 8000

# Running with gunicorn
RUN chmod +x /usr/src/app/start.sh
CMD ["/usr/src/app/start.sh"]