const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport'); // Importar para la comunicación con Arduino
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configuración del puerto serial para comunicarse con Arduino
const puertoSerial = new SerialPort({
    path: 'COM3', // Cambia "COM3" al puerto correcto
    baudRate: 9600
});

const parser = puertoSerial.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// Configurar Express para recibir datos JSON
app.use(express.json());

// Ruta para recibir los datos de los sensores
app.post('/api/sensores', (req, res) => {
    const datosSensor = req.body;
    console.log("Datos recibidos del proxy local:", datosSensor);

    // Enviar los datos a todos los clientes conectados
    io.emit('actualizar-sensores', datosSensor);
    res.status(200).send({ status: 'success', data: datosSensor });
});

// Endpoint para reservar un espacio
app.post('/api/reservar', (req, res) => {
    const { espacio } = req.body; // espacio debe ser 1, 2 o 3
    if (espacio < 1 || espacio > 3) {
        return res.status(400).send({ error: 'Espacio no válido' });
    }

    // Enviar comando de encender LED al Arduino
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

    // Enviar comando de apagar LED al Arduino
    puertoSerial.write(`cancelar:${espacio}\n`, (err) => {
        if (err) {
            return res.status(500).send({ error: 'Error al cancelar la reserva' });
        }
        res.send({ status: 'Reserva cancelada', espacio });
    });
});

// Servir archivos estáticos
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
