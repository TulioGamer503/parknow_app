const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configurar Express para recibir datos JSON
app.use(express.json());

// Almacenar el estado de reserva de los espacios
const espaciosReservados = {
    1: false,
    2: false,
    3: false
};

// Ruta para recibir los datos de los sensores
app.post('/api/sensores', (req, res) => {
    const datosSensor = req.body;
    console.log("Datos recibidos del proxy local:", datosSensor);

    // Enviar los datos a todos los clientes conectados
    io.emit('actualizar-sensores', datosSensor);
    res.status(200).send({ status: 'success', data: datosSensor });
});

// Manejar conexiones de Socket.io
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    // Escuchar eventos de reserva
    socket.on('reservar', (espacio) => {
        if (espacio >= 1 && espacio <= 3) {
            espaciosReservados[espacio] = true; // Reservar el espacio
            console.log(`Espacio ${espacio} reservado`);
            socket.emit('reserva-confirmada', espacio);
        } else {
            socket.emit('error', 'Espacio no válido');
        }
    });

    // Escuchar eventos de cancelación
    socket.on('cancelar', (espacio) => {
        if (espacio >= 1 && espacio <= 3) {
            espaciosReservados[espacio] = false; // Cancelar la reserva
            console.log(`Reserva del espacio ${espacio} cancelada`);
            socket.emit('cancelacion-confirmada', espacio);
        } else {
            socket.emit('error', 'Espacio no válido');
        }
    });
});

// Servir archivos estáticos
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
