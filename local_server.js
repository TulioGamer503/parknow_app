const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const axios = require('axios');

const app = express();

// Middleware para parsear el JSON
app.use(express.json());

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

// Rutas para encender y apagar LEDs
app.post('/api/encender', (req, res) => {
    const sensorId = req.body.sensorId;
    if (sensorId) {
        const command = `ENCENDER:${sensorId}`;
        puertoSerial.write(command + '\n', (err) => {
            if (err) {
                return res.status(500).send("Error al enviar el comando al Arduino: " + err.message);
            }
            console.log(`Comando enviado: ${command}`);
            res.send("LED encendido.");
        });
    } else {
        res.status(400).send("ID del sensor no proporcionado.");
    }
});

app.post('/api/apagar', (req, res) => {
    const sensorId = req.body.sensorId;
    if (sensorId) {
        const command = `APAGAR:${sensorId}`;
        puertoSerial.write(command + '\n', (err) => {
            if (err) {
                return res.status(500).send("Error al enviar el comando al Arduino: " + err.message);
            }
            console.log(`Comando enviado: ${command}`);
            res.send("LED apagado.");
        });
    } else {
        res.status(400).send("ID del sensor no proporcionado.");
    }
});

// Iniciar el servidor local
app.listen(4000, () => {
    console.log('Servidor local escuchando en http://localhost:4000');
});
