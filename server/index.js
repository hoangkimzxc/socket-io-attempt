const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        "Referrer Policy": "strict-origin-when-cross-origin"
    }
});

// Store users in rooms
const roomUsers = {};

// Store old messages in a data structure
const roomMessages = {};

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("join_room", (data) => {
        socket.join(data);
        console.log(`User with ID: ${socket.id} join room: ${data}`);

        // Send old messages for the joined room
        if (roomMessages[data]) {
            socket.emit("load_old_messages", roomMessages[data]);
        }

        // Store user in room
        if (!roomUsers[data]) {
            roomUsers[data] = [];
        }
        roomUsers[data].push(socket.id);
    });



    socket.on('typing', data => {
        socket.broadcast.emit('typing', data);
    });

    socket.on("send_message", (data) => {
        socket.to(data.room).emit('receive_message', data);
        console.log(data);

        // Store the message in the roomMessages data structure
        if (!roomMessages[data.room]) {
            roomMessages[data.room] = [];
        }
        roomMessages[data.room].push(data);
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
        // Remove user from room
        for (const room in roomUsers) {
            const index = roomUsers[room].indexOf(socket.id);
            if (index !== -1) {
                roomUsers[room].splice(index, 1);

                // Clear chat history if everyone left the room
                if (roomUsers[room].length === 0) {
                    delete roomMessages[room];
                    io.to(room).emit("clear_chat_history");
                }

                break;
            }
        }

    });


});

server.listen(3001, () => {
    console.log('SERVER RUNNING');
});
