const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = new Map();

function getRoom(roomId) {
  const id = String(roomId || 'room-1');
  if (!rooms.has(id)) {
    rooms.set(id, {
      players: new Map(),
      log: [],
      startedAt: Date.now(),
    });
  }
  return rooms.get(id);
}

function serializeRoom(room) {
  return {
    players: Object.fromEntries(
      [...room.players.entries()].map(([role, player]) => [
        role,
        {
          username: player.username,
          hp: player.hp,
          role: player.role,
          id: player.id,
        },
      ])
    ),
    log: room.log.slice(0, 8),
    startedAt: room.startedAt,
  };
}

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ roomId, username, role }) => {
    const room = getRoom(roomId);
    const safeUsername = String(username || 'Player');
    const safeRole = role === 'attacker' || role === 'target' ? role : room.players.has('attacker') ? 'target' : 'attacker';

    room.players.set(safeRole, {
      id: socket.id,
      username: safeUsername,
      hp: 100,
      role: safeRole,
    });

    socket.join(String(roomId));
    socket.data.roomId = String(roomId);
    socket.data.role = safeRole;

    room.log.unshift(`${safeUsername} 进入房间，角色：${safeRole}`);
    io.to(String(roomId)).emit('roomState', serializeRoom(room));
  });

  socket.on('shotResult', ({ roomId, hit, reason }) => {
    const room = getRoom(roomId);
    const attacker = room.players.get('attacker');
    const target = room.players.get('target');

    if (!attacker || !target) {
      return;
    }

    if (socket.id !== attacker.id) {
      return;
    }

    if (hit) {
      target.hp = Math.max(0, target.hp - 25);
      room.log.unshift(`攻击命中：${attacker.username} -> ${target.username}（${reason || '中心区域检测到人脸'}）`);
    } else {
      room.log.unshift(`攻击未命中：${attacker.username}（${reason || '当前帧未命中'}）`);
    }

    io.to(String(roomId)).emit('roomState', serializeRoom(room));

    if (target.hp <= 0) {
      io.to(String(roomId)).emit('gameOver', {
        winner: 'attacker',
        loser: 'target',
      });
    }
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (!roomId) {
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      return;
    }

    for (const [role, player] of room.players.entries()) {
      if (player.id === socket.id) {
        room.players.delete(role);
        room.log.unshift(`${player.username} 离开了房间`);
        break;
      }
    }

    io.to(roomId).emit('roomState', serializeRoom(room));
  });
});

app.get('/health', (_, res) => {
  res.json({ ok: true, rooms: rooms.size });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
