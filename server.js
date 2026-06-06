const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  global.io = io; // Make io accessible in Next.js API routes if they run in same process

  io.on('connection', (socket) => {
    // console.log('Client connected:', socket.id);

    socket.on('join:staff', () => {
      socket.join('staff');
    });

    socket.on('join:student', (studentId) => {
      socket.join(`student:${studentId}`);
    });

    socket.on('disconnect', () => {
      // console.log('Client disconnected:', socket.id);
    });
  });

  // VERY simplified background scheduler mock
  // In a real production app, use Redis / BullMQ / cron.
  setInterval(async () => {
    // Since Next.js API routes are isolated, we use a loop here to fetch an internal API 
    // that processes the scheduler logic.
    try {
      if(process.env.MONGODB_URI) {
        // Ping internal route to trigger scheduler
        await fetch(`http://localhost:${port}/api/internal/scheduler`, {
          method: 'POST',
          headers: { 'x-scheduler-secret': 'dev-secret' } // protect internal route
        }).catch(()=>null);
      }
    } catch(e){}
  }, 30000); // Check every 30 seconds

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
