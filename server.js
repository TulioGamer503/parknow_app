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

// Agregar un nuevo endpoint para manejar la reserva
app.post('/api/reservar/:numeroSensor', (req, res) => {
    const numeroSensor = req.params.numeroSensor;

    // Aquí puedes agregar la lógica para manejar la reserva
    // Por ejemplo, almacenar el estado en la base de datos o enviar un evento a los clientes conectados

    console.log(`Reserva realizada para el sensor ${numeroSensor}`);
    res.send(`Sensor ${numeroSensor} reservado.`);
});

// Servir archivos estáticos
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
