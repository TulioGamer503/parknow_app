const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const puertoSerial = new SerialPort({
    path: 'COM3', // Cambia "COM3" al puerto correcto
    baudRate: 9600
});

const parser = puertoSerial.pipe(new ReadlineParser({ delimiter: '\r\n' }));

parser.on('data', (datosRecibidos) => {
    try {
        const datosSensor = JSON.parse(datosRecibidos);
        console.log("Datos recibidos:", datosSensor);

        // Enviar los datos a todos los clientes conectados
        io.emit('actualizar-sensores', datosSensor);
    } catch (err) {
        console.error("Error al parsear los datos del sensor:", err.message);
    }
});

puertoSerial.on('error', (err) => {
    console.error("Error al abrir el puerto serial:", err.message);
});

// Configurar Express para servir archivos estáticos
app.use(express.static('public'));

server.listen(3000, () => {
    console.log('Servidor escuchando en http://localhost:3000');
});
