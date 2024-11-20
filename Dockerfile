# Usa la imagen oficial de Nginx
FROM nginx:alpine

# Copia los archivos HTML al directorio de Nginx
COPY . /usr/share/nginx/html

# Exponer el puerto 80 para acceder a la página
EXPOSE 80

