import './style.css';
import { io } from 'socket.io-client';

let canvas: HTMLCanvasElement = document.createElement('canvas');
let c = canvas.getContext('2d');
canvas.height = innerHeight;
canvas.width = innerWidth;
document.body.append(canvas);

let socket = io('http://localhost:3000');

let currentColor = document.getElementById('currentColor')

class Player {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  color: string;
  id: number;

  constructor(id: number, x: number, y: number, color: string) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };
    this.color = color;
    this.id = id;
  }

  draw(): void {
    if (c) {
      c.fillStyle = this.color;
      c.fillRect(this.position.x, this.position.y, 20, 20);
    }
  }

  update(): void {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.draw();
  }
}

let players: Record<number, Player> = {};
let player: Player;

// Handle player creation
socket.on('player-joined', (data) => {
  // Initialize the current player
  const { player: currentPlayer, existingPlayers } = data;
  player = new Player(
    currentPlayer.id,
    currentPlayer.position.x,
    currentPlayer.position.y,
    currentPlayer.color
  );
  if(currentColor){
    currentColor.style.background = currentPlayer.color
    }

  players[currentPlayer.id] = player;

  // Add existing players to the list
  existingPlayers.forEach((p: Player) => {
    if (!players[p.id]) {
      players[p.id] = new Player(p.id, p.position.x, p.position.y, p.color);
    }
  });
});
socket.on('new-player', (data) => {
  if (!players[data.id]) {
    players[data.id] = new Player(data.id, data.position.x, data.position.y, data.color);
  }
});

socket.on('player-moved', (updatedPlayers) => {
  updatedPlayers.forEach((p: Player) => {
    if (players[p.id]) {
      players[p.id].position = p.position;
      players[p.id].velocity = p.velocity;
    }
  });
});

console.log(players)

// Player controls
document.addEventListener('keydown', (e) => {
  if (!player) return;

  switch (e.key) {
    case 'w':
      player.velocity.y = -1;
      break;
    case 'a':
      player.velocity.x = -1;
      break;
    case 's':
      player.velocity.y = 1;
      break;
    case 'd':
      player.velocity.x = 1;
      break;
  }

  socket.emit('changed-position', { id: player.id, position: player.position, velocity: player.velocity });
});

document.addEventListener('keyup', (e) => {
  if (!player) return;

  switch (e.key) {
    case 'w':
    case 's':
      player.velocity.y = 0;
      break;
    case 'a':
    case 'd':
      player.velocity.x = 0;
      break;
  }

  socket.emit('changed-position', { id: player.id, position: player.position, velocity: player.velocity });
});


const animate = (): void => {
  if (c) {
    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, canvas.height);

    Object.values(players).forEach((p) => p.update());
  }

  requestAnimationFrame(animate);
};

animate();
