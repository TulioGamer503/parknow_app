const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configurar Express para recibir datos JSON
app.use(express.json());

// Ruta para recibir los datos de los sensores
app.post('/api/sensores', (req, res) => {
    console.log("Datos recibidos en el servidor:", req.body); // Agregar este log
    const datosSensor = req.body;
    
    // Validar los datos del sensor
    if (!datosSensor || !datosSensor.Sensor1 || !datosSensor.Sensor2 || !datosSensor.Sensor3) {
        return res.status(400).send({ status: 'error', message: 'Datos del sensor inválidos' });
    }

    console.log("Datos válidos recibidos del proxy local:", datosSensor);
    io.emit('actualizar-sensores', datosSensor);
    res.status(200).send({ status: 'success', data: datosSensor });
});

// Enviar el estado inicial de los sensores cuando un cliente se conecta
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    // Aquí puedes definir los estados iniciales de los sensores
    const estadoInicial = {
        Sensor1: 1, // Cambia este valor según el estado real
        Sensor2: 1, // Cambia este valor según el estado real
        Sensor3: 0  // Cambia este valor según el estado real
    };

    // Emitir el estado inicial al cliente
    socket.emit('actualizar-sensores', estadoInicial);

    // Manejar la reserva de un sensor
    socket.on('reservar', (data) => {
        console.log(`Sensor reservado: ${data.sensorId}`);
        // Aquí puedes manejar la lógica para reservar el sensor
        // (por ejemplo, actualizando el estado de los sensores)
    });
});

// Servir archivos estáticos
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
