const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const axios = require('axios');

const app = express();
app.use(express.json()); // Middleware para manejar JSON

// Estado del servidor
let servidorEnLinea = false;

// Configuración del puerto serial
const puertoSerial = new SerialPort({
    path: 'COM3', // Cambia "COM3" al puerto correcto
    baudRate: 9600
});

const parser = puertoSerial.pipe(new ReadlineParser({ delimiter: '\r\n' }));

parser.on('data', (datosRecibidos) => {
    try {
        const datosSensor = JSON.parse(datosRecibidos);
        console.log("Datos recibidos:", datosSensor);

        // Cambiar el estado del servidor si se reciben datos
        servidorEnLinea = true;

        // Enviar los datos al servidor en la nube
        axios.post('https://parknow-app.onrender.com/api/sensores', datosSensor)
            .then(response => {
                console.log("Datos enviados al servidor:", response.data);
            })
            .catch(error => {
                console.error("Error al enviar datos al servidor:", error.message);
            });
    } catch (err) {
        console.error("Error al parsear los datos del sensor:", err.message);
    }
});

puertoSerial.on('error', (err) => {
    console.error("Error al abrir el puerto serial:", err.message);
});

// Endpoint para verificar el estado del servidor
app.get('/api/estado', (req, res) => {
    res.json({ enLinea: servidorEnLinea });
});

// Iniciar el servidor local
app.listen(4000, () => {
    console.log('Servidor local escuchando en http://localhost:4000');
});
