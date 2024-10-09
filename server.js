const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios'); // Importar axios para enviar solicitudes al servidor local

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configurar Express para recibir datos JSON
app.use(express.json());

let estadosReserva = {
    espacio1: false, // false = no reservado, true = reservado
    espacio2: false,
    espacio3: false
};

// Ruta para recibir los datos de los sensores (no modificar)
app.post('/api/sensores', (req, res) => {
    const datosSensor = req.body;
    console.log("Datos recibidos del proxy local:", datosSensor);

    // Enviar los datos de los sensores a todos los clientes conectados
    io.emit('actualizar-sensores', datosSensor);
    res.status(200).send({ status: 'success', data: datosSensor });
});

// Ruta para reservar un espacio
app.post('/api/reservar', (req, res) => {
    const { espacio, estadoReserva } = req.body;

    if (espacio && (espacio === 'espacio1' || espacio === 'espacio2' || espacio === 'espacio3')) {
        // Actualizar el estado de reserva
        estadosReserva[espacio] = estadoReserva;
        console.log(`Reserva actualizada: ${espacio} -> ${estadoReserva}`);

        // Enviar los datos de reserva a todos los clientes conectados
        io.emit('actualizar-reservas', estadosReserva);

        // Enviar comando al servidor local para encender o apagar el LED
        const estadoComando = estadoReserva ? 'reservar' : 'cancelar';
        axios.post('http://localhost:4000/api/' + estadoComando, { espacio: espacio.replace('espacio', '') })
            .then(response => {
                console.log(`Comando enviado al Arduino para ${estadoComando}:`, response.data);
            })
            .catch(error => {
                console.error(`Error al enviar comando al Arduino: ${error.message}`);
            });

        res.status(200).send({ status: 'success', message: `Reserva actualizada para ${espacio}`, data: estadosReserva });
    } else {
        res.status(400).send({ status: 'error', message: 'Espacio no válido' });
    }
});

// Servir archivos estáticos
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
