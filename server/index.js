const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const { addUser, getUser, getUserInRoom, removeUser } = require('./users');

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "localhost:5000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors());
app.use(router);

io.on('connect', (socket) => {
    console.log('a user is connected');


    socket.on('join', ({name, room}, callback) => {
        
        const { error, user} = addUser({ id: socket.id, name, room});

        if (error) return callback(error);

        socket.emit('message', { user: 'admin', text: `${user.name}, Welcome to the room ${user.room}`});

        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!`});

        socket.join(user.room);

        io.to(user.room).emit('roomData', { room: user.room, users: getUserInRoom(user.room)});

        callback();
        
    });

    socket.on('sendMessage', (message, callBack) => {
        const user = getUser(socket.id);

        console.log(user)

        io.to(user.room).emit('message', {user: user.name, text: message});

        callBack();
    });
 
    socket.on('disconnect', () => {
        const user =  removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', {user: 'admin', text: `${user.name} has left`});
        }
    })
});

server.listen(PORT, () => console.log(`Server is listening to port ${PORT}`));

