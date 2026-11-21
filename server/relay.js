#!/usr/bin/env node
/**
 * Gece Bahçesi — ortak oyun aktarıcısı
 * Aynı odadaki oyuncuların mesajlarını birbirine iletir. Oyun durumu sunucuda
 * tutulmaz; yalnızca oda bazlı yayın (broadcast) yapar.
 *
 *   node server/relay.js            # ws://localhost:8787
 *   PORT=9000 node server/relay.js
 *
 * Oyunda "Aktarıcı adresi" alanına wss://sunucun/oda (veya yerelde
 * ws://localhost:8787/oda) yazman yeterli.
 */
const http = require('http');
const crypto = require('crypto');

function decodeFrame(buf) {
  if (buf.length < 2) return null;
  const b1 = buf[1];
  const masked = (b1 & 0x80) !== 0;
  let len = b1 & 0x7f;
  let offset = 2;
  if (len === 126) {
    if (buf.length < 4) return null;
    len = buf.readUInt16BE(2);
    offset = 4;
  } else if (len === 127) {
    if (buf.length < 10) return null;
    len = Number(buf.readBigUInt64BE(2));
    offset = 10;
  }
  const maskLen = masked ? 4 : 0;
  if (buf.length < offset + maskLen + len) return null;
  const payload = Buffer.from(buf.slice(offset + maskLen, offset + maskLen + len));
  if (masked) {
    const mask = buf.slice(offset, offset + 4);
    for (let i = 0; i < payload.length; i += 1) payload[i] ^= mask[i % 4];
  }
  return { opcode: buf[0] & 0x0f, payload, size: offset + maskLen + len };
}

function encodeFrame(text) {
  const data = Buffer.from(text);
  const len = data.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x81, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, data]);
}

const rooms = new Map(); // room -> Set<client>

function send(client, obj) {
  try {
    client.socket.write(encodeFrame(JSON.stringify(obj)));
  } catch (error) {
    /* yoksay */
  }
}

function broadcast(room, obj, except) {
  const set = rooms.get(room);
  if (!set) return;
  for (const client of set) {
    if (client !== except) send(client, obj);
  }
}

function presence(room) {
  const set = rooms.get(room);
  if (!set) return [];
  return Array.from(set).map((client) => ({ from: client.id, name: client.name }));
}

function join(client, room, name) {
  if (client.room && client.room !== room) leave(client);
  client.room = room;
  client.name = name || client.name || 'Gezgin';
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room).add(client);
  send(client, { t: 'room', room });
  broadcast(room, { t: 'presence', room, peers: presence(room) }, client);
  broadcast(room, { t: 'hello', room, from: client.id, name: client.name }, client);
  console.log(`[${room}] ${client.name} katıldı (${rooms.get(room).size} kişi)`);
}

function leave(client) {
  const room = client.room;
  if (!room) return;
  const set = rooms.get(room);
  if (set) {
    set.delete(client);
    broadcast(room, { t: 'bye', room, from: client.id, name: client.name });
    broadcast(room, { t: 'presence', room, peers: presence(room) });
    if (!set.size) rooms.delete(room);
  }
  client.room = null;
  console.log(`[${room}] ${client.name} ayrıldı`);
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Gece Bahçesi aktarıcısı çalışıyor. WebSocket ile bağlan.\n');
});

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );
  socket.setNoDelay(true);

  const client = { id: 'p' + crypto.randomBytes(3).toString('hex'), socket, room: null, name: 'Gezgin', buffer: Buffer.alloc(0) };
  send(client, { t: 'welcome', room: null });

  socket.on('data', (chunk) => {
    client.buffer = Buffer.concat([client.buffer, chunk]);
    for (;;) {
      const frame = decodeFrame(client.buffer);
      if (!frame) break;
      client.buffer = client.buffer.slice(frame.size);
      if (frame.opcode === 0x8) {
        leave(client);
        socket.end();
        return;
      }
      if (frame.opcode === 0x9) {
        socket.write(Buffer.from([0x8a, 0x00]));
        continue;
      }
      if (frame.opcode !== 0x1) continue;
      let data = null;
      try {
        data = JSON.parse(frame.payload.toString('utf8'));
      } catch (error) {
        continue;
      }
      if (!data || typeof data.t !== 'string') continue;
      if (data.t === 'join') {
        join(client, String(data.room || '').toUpperCase().slice(0, 8), String(data.name || '').slice(0, 14));
        continue;
      }
      if (!client.room) continue;
      if (data.t === 'presence-req') {
        send(client, { t: 'presence', room: client.room, peers: presence(client.room) });
        continue;
      }
      // diğer tüm mesajları (state, chat, hit, invite…) odaya dağıt
      broadcast(client.room, Object.assign({}, data, { room: client.room, from: client.id, name: client.name }), client);
    }
  });

  socket.on('close', () => leave(client));
  socket.on('error', () => leave(client));
});

const port = Number(process.env.PORT) > 0 ? Number(process.env.PORT) : 8787;
server.listen(port, '0.0.0.0', () => {
  const actual = server.address().port;
  console.log(`Gece Bahçesi aktarıcısı: ws://localhost:${actual} (sağlık: http://localhost:${actual}/health)`);
});
