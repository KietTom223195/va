import express from 'express';
import cors from 'cors';
import { db, initDb } from './db.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Helper to convert HH:MM to minutes
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Helper to check showtime overlaps
async function checkOverlap(roomName, showDate, startTimeStr, duration, excludeShowtimeId = null) {
  const query = `
    SELECT s.id, s.start_time, s.room_name, s.show_date, m.title, m.duration
    FROM showtimes s
    JOIN movies m ON s.movie_id = m.id
    WHERE s.room_name = ? AND s.show_date = ?
    ${excludeShowtimeId ? 'AND s.id != ?' : ''}
  `;
  const params = excludeShowtimeId ? [roomName, showDate, excludeShowtimeId] : [roomName, showDate];
  const existingShowtimes = await db.all(query, params);

  const newStart = timeToMinutes(startTimeStr);
  const newEnd = newStart + duration + 15; // 15-minute buffer for cleaning

  for (const ex of existingShowtimes) {
    const exStart = timeToMinutes(ex.start_time);
    const exEnd = exStart + ex.duration + 15; // 15-minute buffer for cleaning

    if (newStart < exEnd && exStart < newEnd) {
      return ex; // Overlap detected! Return the conflicting showtime.
    }
  }
  return null; // No overlap
}

// Initialize Database
initDb().catch(console.error);

// ==========================================
// 1. GENRES ROUTER (CRUD)
// ==========================================
app.get('/api/genres', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM genres ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/genres', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await db.run('INSERT INTO genres (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.id, name });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Thể loại này đã tồn tại' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/genres/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    await db.run('UPDATE genres SET name = ? WHERE id = ?', [name, id]);
    res.json({ id: Number(id), name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/genres/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Check if there are movies linked to this genre
    const movieLink = await db.get('SELECT COUNT(*) as count FROM movies WHERE genre_id = ?', [id]);
    if (movieLink.count > 0) {
      return res.status(400).json({ error: 'Không thể xóa thể loại này vì đang có phim liên kết' });
    }
    await db.run('DELETE FROM genres WHERE id = ?', [id]);
    res.json({ message: 'Genre deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. MOVIES ROUTER (CRUD)
// ==========================================
app.get('/api/movies', async (req, res) => {
  try {
    const query = `
      SELECT m.*, g.name as genre_name
      FROM movies m
      JOIN genres g ON m.genre_id = g.id
      ORDER BY m.created_at DESC
    `;
    const rows = await db.all(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/movies', async (req, res) => {
  try {
    const { title, duration, description, image_url, genre_id, status } = req.body;
    if (!title || !duration || !genre_id || !status) {
      return res.status(400).json({ error: 'Các trường bắt buộc: Tiêu đề, Thời lượng, Thể loại, Trạng thái' });
    }
    const result = await db.run(
      'INSERT INTO movies (title, duration, description, image_url, genre_id, status) VALUES (?, ?, ?, ?, ?, ?)',
      [title, duration, description, image_url, genre_id, status]
    );
    res.status(201).json({ id: result.id, title, duration, description, image_url, genre_id, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, duration, description, image_url, genre_id, status } = req.body;
    if (!title || !duration || !genre_id || !status) {
      return res.status(400).json({ error: 'Các trường bắt buộc: Tiêu đề, Thời lượng, Thể loại, Trạng thái' });
    }
    await db.run(
      'UPDATE movies SET title = ?, duration = ?, description = ?, image_url = ?, genre_id = ?, status = ? WHERE id = ?',
      [title, duration, description, image_url, genre_id, status, id]
    );
    res.json({ id: Number(id), title, duration, description, image_url, genre_id, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Check if there are active showtimes
    const showtimeLink = await db.get('SELECT COUNT(*) as count FROM showtimes WHERE movie_id = ?', [id]);
    if (showtimeLink.count > 0) {
      return res.status(400).json({ error: 'Không thể xóa phim này vì có suất chiếu đã lên lịch' });
    }
    await db.run('DELETE FROM movies WHERE id = ?', [id]);
    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. SHOWTIMES ROUTER
// ==========================================
app.get('/api/showtimes', async (req, res) => {
  try {
    const { movie_id, date } = req.query;
    let query = `
      SELECT s.*, m.title as movie_title, m.duration as movie_duration, g.name as genre_name
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      JOIN genres g ON m.genre_id = g.id
    `;
    const params = [];
    const conditions = [];

    if (movie_id) {
      conditions.push('s.movie_id = ?');
      params.push(movie_id);
    }
    if (date) {
      conditions.push('s.show_date = ?');
      params.push(date);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.show_date ASC, s.start_time ASC';

    const rows = await db.all(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/showtimes', async (req, res) => {
  try {
    const { movie_id, room_name, show_date, start_time, ticket_price } = req.body;
    if (!movie_id || !room_name || !show_date || !start_time || !ticket_price) {
      return res.status(400).json({ error: 'Missing showtime fields' });
    }

    // Get movie duration
    const movie = await db.get('SELECT title, duration FROM movies WHERE id = ?', [movie_id]);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    // Check showtime overlap
    const conflict = await checkOverlap(room_name, show_date, start_time, movie.duration);
    if (conflict) {
      const conflictEndMin = timeToMinutes(conflict.start_time) + conflict.duration;
      const conflictEndStr = `${Math.floor(conflictEndMin / 60).toString().padStart(2, '0')}:${(conflictEndMin % 60).toString().padStart(2, '0')}`;
      return res.status(400).json({
        error: `Trùng lịch! Phòng ${room_name} vào khung giờ này đã được lên lịch cho phim "${conflict.title}" từ ${conflict.start_time} đến ${conflictEndStr} (cộng 15 phút dọn dẹp).`
      });
    }

    const result = await db.run(
      'INSERT INTO showtimes (movie_id, room_name, show_date, start_time, ticket_price) VALUES (?, ?, ?, ?, ?)',
      [movie_id, room_name, show_date, start_time, ticket_price]
    );

    res.status(201).json({ id: result.id, movie_id, room_name, show_date, start_time, ticket_price });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/showtimes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Check if there are active bookings
    const bookings = await db.get(`
      SELECT COUNT(*) as count 
      FROM booking_items bi
      JOIN bookings b ON bi.booking_id = b.id
      WHERE bi.showtime_id = ? AND b.status != 'Đã hủy'
    `, [id]);

    if (bookings.count > 0) {
      return res.status(400).json({ error: 'Không thể xóa suất chiếu đã có vé được đặt' });
    }

    await db.run('DELETE FROM showtimes WHERE id = ?', [id]);
    res.json({ message: 'Showtime deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get occupied seats for a showtime
app.get('/api/showtimes/:id/seats', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT bi.seat_number
      FROM booking_items bi
      JOIN bookings b ON bi.booking_id = b.id
      WHERE bi.showtime_id = ? AND b.status != 'Đã hủy'
    `;
    const rows = await db.all(query, [id]);
    const seats = rows.map(r => r.seat_number);
    res.json({ occupiedSeats: seats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. BOOKINGS ROUTER
// ==========================================
app.get('/api/bookings', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT b.*, 
             (SELECT GROUP_CONCAT(bi.seat_number, ', ') FROM booking_items bi WHERE bi.booking_id = b.id) as seats,
             (SELECT m.title FROM booking_items bi JOIN showtimes s ON bi.showtime_id = s.id JOIN movies m ON s.movie_id = m.id WHERE bi.booking_id = b.id LIMIT 1) as movie_title,
             (SELECT s.show_date || ' ' || s.start_time FROM booking_items bi JOIN showtimes s ON bi.showtime_id = s.id WHERE bi.booking_id = b.id LIMIT 1) as showtime_info
      FROM bookings b
      ORDER BY b.booking_date DESC
    `;
    const rows = await db.all(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });

    const items = await db.all(`
      SELECT bi.*, s.room_name, s.show_date, s.start_time, m.title as movie_title
      FROM booking_items bi
      JOIN showtimes s ON bi.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      WHERE bi.booking_id = ?
    `, [id]);

    res.json({ ...booking, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create checkout
app.post('/api/bookings', async (req, res) => {
  const { customer_name, phone, email, showtime_id, seats } = req.body;
  if (!customer_name || !phone || !email || !showtime_id || !seats || seats.length === 0) {
    return res.status(400).json({ error: 'Thiếu thông tin đặt vé' });
  }

  try {
    // Get showtime ticket price
    const showtime = await db.get('SELECT ticket_price FROM showtimes WHERE id = ?', [showtime_id]);
    if (!showtime) return res.status(404).json({ error: 'Suất chiếu không tồn tại' });

    // Validate that seats are not already booked
    const existingBooked = await db.all(`
      SELECT bi.seat_number
      FROM booking_items bi
      JOIN bookings b ON bi.booking_id = b.id
      WHERE bi.showtime_id = ? AND b.status != 'Đã hủy'
    `, [showtime_id]);
    
    const occupiedSeats = existingBooked.map(r => r.seat_number);
    const doubleBooked = seats.filter(seat => occupiedSeats.includes(seat));
    if (doubleBooked.length > 0) {
      return res.status(400).json({ error: `Ghế sau đã có người đặt: ${doubleBooked.join(', ')}. Vui lòng chọn ghế khác!` });
    }

    // Begin transaction via SQLite commands sequentially
    await db.run('BEGIN TRANSACTION');

    const totalPrice = showtime.ticket_price * seats.length;

    const bookingResult = await db.run(
      'INSERT INTO bookings (customer_name, phone, email, total_price, status) VALUES (?, ?, ?, ?, ?)',
      [customer_name, phone, email, totalPrice, 'Chờ thanh toán']
    );
    const bookingId = bookingResult.id;

    for (const seat of seats) {
      await db.run(
        'INSERT INTO booking_items (booking_id, showtime_id, seat_number, price) VALUES (?, ?, ?, ?)',
        [bookingId, showtime_id, seat, showtime.ticket_price]
      );
    }

    await db.run('COMMIT');

    res.status(201).json({
      id: bookingId,
      customer_name,
      phone,
      email,
      total_price: totalPrice,
      status: 'Chờ thanh toán',
      seats
    });

  } catch (error) {
    try {
      await db.run('ROLLBACK');
    } catch (e) {
      // rollback failed if not in transaction, safe to ignore
    }
    res.status(500).json({ error: error.message });
  }
});

// Update Booking Status
app.patch('/api/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['Chờ thanh toán', 'Đã thanh toán', 'Đã hủy'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }
    await db.run('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
    res.json({ id: Number(id), status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. STATISTICS ROUTER (Admin widgets)
// ==========================================
app.get('/api/stats', async (req, res) => {
  try {
    const revenue = await db.get("SELECT SUM(total_price) as sum FROM bookings WHERE status = 'Đã thanh toán'");
    const tickets = await db.get(`
      SELECT COUNT(*) as count 
      FROM booking_items bi
      JOIN bookings b ON bi.booking_id = b.id
      WHERE b.status = 'Đã thanh toán'
    `);
    const activeMovies = await db.get("SELECT COUNT(*) as count FROM movies WHERE status = 'Đang chiếu'");
    const pendingBookings = await db.get("SELECT COUNT(*) as count FROM bookings WHERE status = 'Chờ thanh toán'");

    res.json({
      revenue: revenue.sum || 0,
      tickets: tickets.count || 0,
      activeMovies: activeMovies.count || 0,
      pendingBookings: pendingBookings.count || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
