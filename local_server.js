const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const axios = require('axios');

const app = express();
app.use(express.json()); // Para recibir datos JSON

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

// Endpoint para reservar
app.post('/api/reservar', (req, res) => {
    const { espacio } = req.body; // espacio debe ser 1, 2 o 3
    if (espacio < 1 || espacio > 3) {
        return res.status(400).send({ error: 'Espacio no válido' });
    }
    
    // Enviar comando de reserva al Arduino
    puertoSerial.write(`reservar:${espacio}\n`, (err) => {
        if (err) {
            return res.status(500).send({ error: 'Error al enviar reserva' });
        }
        res.send({ status: 'Reservado', espacio });
    });
});

// Endpoint para cancelar la reserva
app.post('/api/cancelar', (req, res) => {
    const { espacio } = req.body; // espacio debe ser 1, 2 o 3
    if (espacio < 1 || espacio > 3) {
        return res.status(400).send({ error: 'Espacio no válido' });
    }
    
    // Enviar comando de cancelación al Arduino
    puertoSerial.write(`cancelar:${espacio}\n`, (err) => {
        if (err) {
            return res.status(500).send({ error: 'Error al cancelar la reserva' });
        }
        res.send({ status: 'Reserva cancelada', espacio });
    });
});

// Iniciar el servidor local
app.listen(4000, () => {
    console.log('Servidor local escuchando en http://localhost:4000');
});
