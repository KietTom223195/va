import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'cine_cinema.db');

const dbConnection = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Helper functions to return promises
export const db = {
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      dbConnection.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      dbConnection.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      dbConnection.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  exec(sql) {
    return new Promise((resolve, reject) => {
      dbConnection.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

export async function initDb() {
  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON;');

  // Genres
  await db.exec(`
    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
  `);

  // Movies
  await db.exec(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      duration INTEGER NOT NULL,
      description TEXT,
      image_url TEXT,
      genre_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Đang chiếu', 'Sắp chiếu')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE RESTRICT
    );
  `);

  // Showtimes
  await db.exec(`
    CREATE TABLE IF NOT EXISTS showtimes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL,
      room_name TEXT NOT NULL,
      show_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      ticket_price REAL NOT NULL,
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
    );
  `);

  // Bookings
  await db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      total_price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Chờ thanh toán' CHECK(status IN ('Chờ thanh toán', 'Đã thanh toán', 'Đã hủy')),
      booking_date DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Booking Items (Details)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS booking_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      showtime_id INTEGER NOT NULL,
      seat_number TEXT NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE,
      UNIQUE(showtime_id, seat_number)
    );
  `);

  // Check if DB is already seeded, if not seed it.
  const genreCount = await db.get('SELECT COUNT(*) as count FROM genres');
  if (genreCount.count === 0) {
    console.log('Seeding initial database content...');

    // Seed Genres
    const genres = ['Hành động', 'Kinh dị', 'Tình cảm', 'Hoạt hình', 'Khoa học viễn tưởng'];
    for (const name of genres) {
      await db.run('INSERT INTO genres (name) VALUES (?)', [name]);
    }

    // Get Genre IDs
    const genreRows = await db.all('SELECT id, name FROM genres');
    const genreMap = {};
    genreRows.forEach(row => {
      genreMap[row.name] = row.id;
    });

    // Seed Movies
    const movies = [
      {
        title: 'Lật Mặt 7: Một Điều Ước',
        duration: 138,
        description: 'Câu chuyện kể về gia đình bà Hai - một người mẹ đơn thân nuôi nấng 5 đứa con khôn lớn. Khi bà Hai gặp tai nạn, các con mỗi người một nơi đùn đẩy trách nhiệm phụng dưỡng mẹ.',
        image_url: '/lat_mat_7.png',
        genre_id: genreMap['Tình cảm'],
        status: 'Đang chiếu'
      },
      {
        title: 'Dune: Hành Tinh Cát - Phần 2',
        duration: 166,
        description: 'Paul Atreides hội ngộ cùng Chani và người Fremen khi anh tìm kiếm sự trả thù chống lại những kẻ đã hủy hoại gia đình mình.',
        image_url: '/dune_2.png',
        genre_id: genreMap['Khoa học viễn tưởng'],
        status: 'Đang chiếu'
      },
      {
        title: 'Conan: Ngôi Sao Năm Cánh 1 Triệu Đô',
        duration: 110,
        description: 'Vụ án mạng bí ẩn xoay quanh thanh kiếm Nhật cổ và cuộc đối đầu nghẹt thở giữa Conan, Kaito Kid và Hattori Heiji tại Hakodate.',
        image_url: '/conan.png',
        genre_id: genreMap['Hoạt hình'],
        status: 'Đang chiếu'
      },
      {
        title: 'A Quiet Place: Day One',
        duration: 100,
        description: 'Trải nghiệm ngày đầu tiên thế giới chìm vào câm lặng khi những sinh vật mù nhạy bén với âm thanh tấn công Trái Đất.',
        image_url: '/quiet_place.png',
        genre_id: genreMap['Kinh dị'],
        status: 'Sắp chiếu'
      }
    ];

    for (const movie of movies) {
      await db.run(
        'INSERT INTO movies (title, duration, description, image_url, genre_id, status) VALUES (?, ?, ?, ?, ?, ?)',
        [movie.title, movie.duration, movie.description, movie.image_url, movie.genre_id, movie.status]
      );
    }

    // Seed Showtimes
    const movieRows = await db.all('SELECT id, title FROM movies');
    const latMat = movieRows.find(m => m.title.includes('Lật Mặt'));
    const dune = movieRows.find(m => m.title.includes('Dune'));
    const conan = movieRows.find(m => m.title.includes('Conan'));

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const showtimes = [
      { movie_id: latMat.id, room_name: 'Phòng 01', show_date: todayStr, start_time: '09:00', ticket_price: 85000 },
      { movie_id: latMat.id, room_name: 'Phòng 01', show_date: todayStr, start_time: '12:00', ticket_price: 85000 },
      { movie_id: dune.id, room_name: 'Phòng 02', show_date: todayStr, start_time: '14:00', ticket_price: 110000 },
      { movie_id: conan.id, room_name: 'Phòng 03', show_date: todayStr, start_time: '10:30', ticket_price: 90000 },
      { movie_id: latMat.id, room_name: 'Phòng 01', show_date: tomorrowStr, start_time: '18:30', ticket_price: 95000 },
      { movie_id: dune.id, room_name: 'Phòng 02', show_date: tomorrowStr, start_time: '20:00', ticket_price: 120000 }
    ];

    for (const st of showtimes) {
      await db.run(
        'INSERT INTO showtimes (movie_id, room_name, show_date, start_time, ticket_price) VALUES (?, ?, ?, ?, ?)',
        [st.movie_id, st.room_name, st.show_date, st.start_time, st.ticket_price]
      );
    }

    // Seed a sample booking to show it off
    const showtimeRows = await db.all('SELECT id FROM showtimes');
    const sampleShowtimeId = showtimeRows[0].id; // Phòng 01, today at 09:00

    await db.run(
      'INSERT INTO bookings (customer_name, phone, email, total_price, status) VALUES (?, ?, ?, ?, ?)',
      ['Nguyễn Văn A', '0912345678', 'vana@gmail.com', 170000, 'Đã thanh toán']
    );

    const bookingResult = await db.get('SELECT id FROM bookings WHERE customer_name = ?', ['Nguyễn Văn A']);
    await db.run(
      'INSERT INTO booking_items (booking_id, showtime_id, seat_number, price) VALUES (?, ?, ?, ?)',
      [bookingResult.id, sampleShowtimeId, 'C3', 85000]
    );
    await db.run(
      'INSERT INTO booking_items (booking_id, showtime_id, seat_number, price) VALUES (?, ?, ?, ?)',
      [bookingResult.id, sampleShowtimeId, 'C4', 85000]
    );

    console.log('Seeding completed successfully.');
  }
}
