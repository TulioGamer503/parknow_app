const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const axios = require('axios');

const app = express();

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

// Ruta para encender la LED amarilla
app.post('/api/encender-amarilla/:numeroSensor', (req, res) => {
    const numeroSensor = req.params.numeroSensor;

    // Enviar el comando al puerto serial para encender la LED amarilla
    puertoSerial.write(`encenderAmarillo${numeroSensor}\n`, (err) => {
        if (err) {
            console.error("Error al enviar el comando al puerto serial:", err.message);
            return res.status(500).send("Error al encender la LED amarilla.");
        }

        console.log(`Comando enviado para encender la LED amarilla del sensor ${numeroSensor}`);
        res.send(`LED amarilla del sensor ${numeroSensor} encendida.`);
    });
});

puertoSerial.on('error', (err) => {
    console.error("Error al abrir el puerto serial:", err.message);
});

// Iniciar el servidor local
app.listen(4000, () => {
    console.log('Servidor local escuchando en http://localhost:4000');
});
