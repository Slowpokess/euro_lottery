Place your SSL certificates here:

1. cert.pem - Your SSL certificate
2. key.pem - Your private key

For production, you should use proper SSL certificates from a Certificate Authority.
For development, you can generate self-signed certificates using:

openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout key.pem -out cert.pem

Note: The nginx configuration expects these files to be named cert.pem and key.pem.