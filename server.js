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
    console.log("Datos recibidos del proxy local:", datosSensor);

    // Enviar los datos a todos los clientes conectados
    io.emit('actualizar-sensores', datosSensor);
    res.status(200).send({ status: 'success', data: datosSensor });
});

// Rutas para encender y apagar LEDs
app.post('/api/encender', (req, res) => {
    const sensorId = req.body.sensorId;
    if (sensorId) {
        // Emitir el evento de encender LED
        io.emit('encender-led', { sensorId });
        console.log(`LED ${sensorId} encendido.`);
        res.send("LED encendido.");
    } else {
        res.status(400).send("ID del sensor no proporcionado.");
    }
});

app.post('/api/apagar', (req, res) => {
    const sensorId = req.body.sensorId;
    if (sensorId) {
        // Emitir el evento de apagar LED
        io.emit('apagar-led', { sensorId });
        console.log(`LED ${sensorId} apagado.`);
        res.send("LED apagado.");
    } else {
        res.status(400).send("ID del sensor no proporcionado.");
    }
});

// Servir archivos estáticos
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
