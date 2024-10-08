const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const SerialPort = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configuración del puerto serial
const puertoSerial = new SerialPort({
    path: 'COM3', // Cambia "COM3" al puerto correcto de tu máquina
    baudRate: 9600
});

const parser = puertoSerial.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// Manejar los datos recibidos del puerto serial
parser.on('data', (data) => {
    console.log("Datos recibidos del Arduino:", data);
});

// Configurar Express para recibir datos JSON
app.use(express.json());

// Ruta para recibir los datos de los sensores
app.post('/api/sensores', (req, res) => {
    const datosSensor = req.body;

    // Validación simple
    if (!datosSensor || typeof datosSensor !== 'object') {
        return res.status(400).send({ status: 'error', message: 'Datos no válidos' });
    }

    console.log("Datos recibidos del proxy local:", datosSensor);

    // Enviar los datos a todos los clientes conectados
    io.emit('actualizar-sensores', datosSensor);
    res.status(200).send({ status: 'success', data: datosSensor });
});

// Ruta para manejar la reserva y encender la luz amarilla
app.post('/api/reservar/:numeroSensor', (req, res) => {
    const numeroSensor = req.params.numeroSensor;

    // Enviar el comando al puerto serial para encender la luz amarilla
    puertoSerial.write(`encenderAmarillo${numeroSensor}\n`, (err) => {
        if (err) {
            console.error("Error al enviar el comando al puerto serial:", err.message);
            return res.status(500).send("Error al encender la luz amarilla.");
        }

        console.log(`Comando enviado para encender la luz amarilla del sensor ${numeroSensor}`);

        // Enviar el evento a los clientes conectados
        io.emit('encender-luz-amarilla', { sensor: numeroSensor });

        res.send(`Sensor ${numeroSensor} reservado y luz amarilla encendida.`);
    });
});

// Manejar errores del puerto serial
puertoSerial.on('error', (err) => {
    console.error("Error en el puerto serial:", err.message);
});

// Servir archivos estáticos
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
