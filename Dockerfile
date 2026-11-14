FROM python:3.12-slim
WORKDIR /app
COPY classroom/requirements.txt /app/classroom/requirements.txt
RUN pip install --no-cache-dir -r classroom/requirements.txt && useradd --create-home classroom
COPY --chown=classroom:classroom index.html /app/index.html
COPY --chown=classroom:classroom assets /app/assets
COPY --chown=classroom:classroom content /app/content
COPY --chown=classroom:classroom classroom /app/classroom
RUN mkdir -p /data && chown classroom:classroom /data
USER classroom
ENV GUBBER_DATA=/data
EXPOSE 7667
CMD ["python", "classroom/server.py", "--host", "0.0.0.0"]
