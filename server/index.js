const io = require('socket.io')(3000, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });
  
  let users = [];
  
  io.on('connection', (socket) => {
    console.log('User connected!', socket.id);
  
    let player = {
      id: socket.id,
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      velocity: { x: 0, y: 0 },
      color: `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`,
    };
  
    users.push(player);
  
    socket.emit('player-joined', {player, existingPlayers:users});
  
    socket.broadcast.emit('new-player', player);
  
    socket.on('changed-position', (data) => {
      let user = users.find((u) => u.id === data.id);
      if (user) {
        user.position = data.position;
        user.velocity = data.velocity;
  
        // Notify all other clients about the moved player
        socket.broadcast.emit('player-moved', [user]);
      }
    });
  
    // Remove player on disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      users = users.filter((u) => u.id !== socket.id);
      socket.broadcast.emit('player-disconnected', socket.id);
    });
  });
  