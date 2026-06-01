import React, { useState, useEffect } from 'react';

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ revenue: 0, tickets: 0, activeMovies: 0, pendingBookings: 0 });
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Modal control & form data states
  const [showModal, setShowModal] = useState(null); 
  const [editTarget, setEditTarget] = useState(null); 
  const [detailBooking, setDetailBooking] = useState(null); 
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [movieForm, setMovieForm] = useState({
    title: '', duration: '', description: '', image_url: '', genre_id: '', status: 'Đang chiếu'
  });
  const [genreForm, setGenreForm] = useState({ name: '' });
  const [showtimeForm, setShowtimeForm] = useState({
    movie_id: '', room_name: 'Phòng 01', show_date: '', start_time: '', ticket_price: 85000
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = () => {
    fetch('/api/stats').then(res => res.json()).then(data => setStats(data));
    fetch('/api/movies').then(res => res.json()).then(data => setMovies(data));
    fetch('/api/genres').then(res => res.json()).then(data => setGenres(data));
    fetch('/api/showtimes').then(res => res.json()).then(data => setShowtimes(data));
    fetch('/api/bookings').then(res => res.json()).then(data => setBookings(data));
  };

  const resetForms = () => {
    setMovieForm({ title: '', duration: '', description: '', image_url: '', genre_id: '', status: 'Đang chiếu' });
    setGenreForm({ name: '' });
    setShowtimeForm({ movie_id: '', room_name: 'Phòng 01', show_date: '', start_time: '', ticket_price: 85000 });
    setEditTarget(null);
    setErrorMessage('');
  };

  // Movie Handlers
  const handleMovieSubmit = (e) => {
    e.preventDefault();
    const method = editTarget ? 'PUT' : 'POST';
    const url = editTarget ? `/api/movies/${editTarget.id}` : '/api/movies';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movieForm)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Thao tác phim thất bại');
        return data;
      })
      .then(() => {
        fetchData();
        setShowModal(null);
        resetForms();
      })
      .catch(err => setErrorMessage(err.message));
  };

  const handleMovieEdit = (movie) => {
    setEditTarget(movie);
    setMovieForm({
      title: movie.title,
      duration: movie.duration,
      description: movie.description || '',
      image_url: movie.image_url || '',
      genre_id: movie.genre_id,
      status: movie.status
    });
    setErrorMessage('');
    setShowModal('movie');
  };

  const handleMovieDelete = (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phim này?')) return;
    fetch(`/api/movies/${id}`, { method: 'DELETE' })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Không thể xóa phim');
        return data;
      })
      .then(() => fetchData())
      .catch(err => alert(err.message));
  };

  // Genre Handlers
  const handleGenreSubmit = (e) => {
    e.preventDefault();
    const method = editTarget ? 'PUT' : 'POST';
    const url = editTarget ? `/api/genres/${editTarget.id}` : '/api/genres';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(genreForm)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Thao tác thể loại thất bại');
        return data;
      })
      .then(() => {
        fetchData();
        setShowModal(null);
        resetForms();
      })
      .catch(err => setErrorMessage(err.message));
  };

  const handleGenreEdit = (genre) => {
    setEditTarget(genre);
    setGenreForm({ name: genre.name });
    setErrorMessage('');
    setShowModal('genre');
  };

  const handleGenreDelete = (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thể loại này?')) return;
    fetch(`/api/genres/${id}`, { method: 'DELETE' })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        return data;
      })
      .then(() => fetchData())
      .catch(err => alert(err.message));
  };

  // Showtime Handlers
  const handleShowtimeSubmit = (e) => {
    e.preventDefault();
    fetch('/api/showtimes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(showtimeForm)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Không thể lên lịch suất chiếu');
        return data;
      })
      .then(() => {
        fetchData();
        setShowModal(null);
        resetForms();
      })
      .catch(err => setErrorMessage(err.message));
  };

  const handleShowtimeDelete = (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa suất chiếu này?')) return;
    fetch(`/api/showtimes/${id}`, { method: 'DELETE' })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        return data;
      })
      .then(() => fetchData())
      .catch(err => alert(err.message));
  };

  // Booking Handlers
  const handleStatusChange = (id, newStatus) => {
    fetch(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => res.json())
      .then(() => fetchData())
      .catch(err => console.error(err));
  };

  const viewBookingDetail = (id) => {
    fetch(`/api/bookings/${id}`)
      .then(res => res.json())
      .then(data => {
        setDetailBooking(data);
        setShowModal('booking-detail');
      })
      .catch(err => console.error(err));
  };

  return (
    <div>
      {/* Tab Selectors inside Admin dashboard */}
      <div className="glass-panel" style={{ display: 'flex', gap: '10px', padding: '15px', marginBottom: '35px', flexWrap: 'wrap' }}>
        <button className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('dashboard')}>
          📊 BÁO CÁO
        </button>
        <button className={`btn ${activeTab === 'movies' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('movies')}>
          🎬 PHIM
        </button>
        <button className={`btn ${activeTab === 'genres' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('genres')}>
          🏷️ THỂ LOẠI
        </button>
        <button className={`btn ${activeTab === 'showtimes' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('showtimes')}>
          📅 SUẤT CHIẾU
        </button>
        <button className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('bookings')}>
          🎟️ ĐƠN VÉ
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div>
          <h2 className="tech-font" style={{ marginBottom: '25px', fontSize: '1.4rem' }}>// DASHBOARD OVERVIEW</h2>
          <div className="stats-terminal-row">
            <div className="glass-panel stat-terminal-box">
              <div className="tech-font" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DOANH THU ĐÃ THU</div>
              <div className="stat-box-num tech-font" style={{ color: 'var(--primary)' }}>{stats.revenue.toLocaleString('vi-VN')} đ</div>
            </div>
            <div className="glass-panel stat-terminal-box" style={{ borderLeftColor: 'var(--secondary)' }}>
              <div className="tech-font" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>VÉ PHÁT HÀNH</div>
              <div className="stat-box-num tech-font" style={{ color: 'var(--secondary)' }}>{stats.tickets}</div>
            </div>
            <div className="glass-panel stat-terminal-box" style={{ borderLeftColor: '#fff' }}>
              <div className="tech-font" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PHIM ĐANG CHIẾU</div>
              <div className="stat-box-num tech-font">{stats.activeMovies}</div>
            </div>
            <div className="glass-panel stat-terminal-box" style={{ borderLeftColor: 'var(--accent)' }}>
              <div className="tech-font" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>HÓA ĐƠN CHỜ</div>
              <div className="stat-box-num tech-font" style={{ color: 'var(--accent)' }}>{stats.pendingBookings}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 className="tech-font" style={{ marginBottom: '20px', fontSize: '1.1rem', color: 'var(--primary)' }}>// GIAO DỊCH VÉ GẦN ĐÂY</h3>
            <div className="cyber-table-container">
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Tên phim</th>
                    <th>Suất chiếu</th>
                    <th>Thành tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 5).map(b => (
                    <tr key={b.id}>
                      <td><strong>{b.customer_name}</strong><br/><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.phone}</span></td>
                      <td>{b.movie_title || 'N/A'}</td>
                      <td className="tech-font">{b.showtime_info || 'N/A'}</td>
                      <td className="tech-font" style={{ color: 'var(--primary)' }}>{b.total_price.toLocaleString('vi-VN')} đ</td>
                      <td>
                        <span className={`tag-status ${
                          b.status === 'Đã thanh toán' ? 'tag-success' :
                          b.status === 'Chờ thanh toán' ? 'tag-warning' : 'tag-danger'
                        }`}>{b.status}</span>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Không có bản ghi giao dịch.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'movies' && (
        <div>
          <div className="panel-header">
            <h2 className="tech-font" style={{ fontSize: '1.4rem' }}>// DANH SÁCH BỘ PHIM</h2>
            <button className="btn btn-primary" onClick={() => { resetForms(); setShowModal('movie'); }}>
              [ + THÊM PHIM MỚI ]
            </button>
          </div>

          <div className="cyber-table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Tên phim</th>
                  <th>Thể loại</th>
                  <th>Thời lượng</th>
                  <th>Trạng thái</th>
                  <th style={{ width: '120px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {movies.map(m => (
                  <tr key={m.id}>
                    <td><strong>{m.title}</strong></td>
                    <td>{m.genre_name}</td>
                    <td className="tech-font">{m.duration} min</td>
                    <td>
                      <span className={`tag-status ${m.status === 'Đang chiếu' ? 'tag-success' : 'tag-warning'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn-icon" onClick={() => handleMovieEdit(m)}>✏️</button>
                        <button className="action-btn-icon delete" onClick={() => handleMovieDelete(m.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'genres' && (
        <div>
          <div className="panel-header">
            <h2 className="tech-font" style={{ fontSize: '1.4rem' }}>// PHÂN HỆ THỂ LOẠI</h2>
            <button className="btn btn-primary" onClick={() => { resetForms(); setShowModal('genre'); }}>
              [ + THÊM THỂ LOẠI ]
            </button>
          </div>

          <div className="cyber-table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Mã ID</th>
                  <th>Thể loại phim</th>
                  <th style={{ width: '120px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {genres.map(g => (
                  <tr key={g.id}>
                    <td className="tech-font">#{g.id}</td>
                    <td><strong>{g.name}</strong></td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn-icon" onClick={() => handleGenreEdit(g)}>✏️</button>
                        <button className="action-btn-icon delete" onClick={() => handleGenreDelete(g.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'showtimes' && (
        <div>
          <div className="panel-header">
            <h2 className="tech-font" style={{ fontSize: '1.4rem' }}>// QUẢN LÝ LỊCH PHÒNG</h2>
            <button className="btn btn-primary" onClick={() => { resetForms(); setShowModal('showtime'); }}>
              [ + XẾP LỊCH CHIẾU ]
            </button>
          </div>

          <div className="cyber-table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Tên phim</th>
                  <th>Phòng chiếu</th>
                  <th>Ngày chiếu</th>
                  <th>Giờ chiếu</th>
                  <th>Giá vé</th>
                  <th style={{ width: '80px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {showtimes.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.movie_title}</strong></td>
                    <td>{s.room_name}</td>
                    <td className="tech-font">{s.show_date}</td>
                    <td className="tech-font">{s.start_time}</td>
                    <td className="tech-font" style={{ color: 'var(--primary)' }}>{s.ticket_price.toLocaleString('vi-VN')} đ</td>
                    <td>
                      <button className="action-btn-icon delete" onClick={() => handleShowtimeDelete(s.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div>
          <h2 className="tech-font" style={{ marginBottom: '25px', fontSize: '1.4rem' }}>// THÔNG TIN BẢNG HÓA ĐƠN</h2>
          <div className="cyber-table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Mã HĐ</th>
                  <th>Khách hàng</th>
                  <th>Lịch chiếu & Phim</th>
                  <th>Thành tiền</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td className="tech-font">#CT-{b.id}</td>
                    <td>
                      <strong>{b.customer_name}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.phone} | {b.email}</div>
                    </td>
                    <td>
                      <div><strong>{b.movie_title || 'N/A'}</strong></div>
                      <div className="tech-font" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.showtime_info || 'N/A'}</div>
                    </td>
                    <td className="tech-font" style={{ color: 'var(--primary)' }}>{b.total_price.toLocaleString('vi-VN')} đ</td>
                    <td>
                      <select
                        className="input-cyber"
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                        value={b.status}
                        onChange={e => handleStatusChange(b.id, e.target.value)}
                      >
                        <option value="Chờ thanh toán">Chờ thanh toán</option>
                        <option value="Đã thanh toán">Đã thanh toán</option>
                        <option value="Đã hủy">Đã hủy</option>
                      </select>
                    </td>
                    <td>
                      <button className="btn btn-secondary tech-font" style={{ padding: '6px 14px', fontSize: '0.75rem' }} onClick={() => viewBookingDetail(b.id)}>
                        [ XEM GHẾ ]
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
         MODALS (CYBER THEMED)
         ========================================== */}
      {showModal === 'movie' && (
        <div className="cyber-modal-overlay">
          <div className="glass-panel cyber-modal">
            <div className="modal-header">
              <h3 className="tech-font" style={{ color: '#fff' }}>{editTarget ? '// CHỈNH SỬA PHIM' : '// THÊM PHIM MỚI'}</h3>
              <button className="modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>
            <form onSubmit={handleMovieSubmit} className="checkout-form">
              <div className="input-cyber-group">
                <label>Tiêu đề bộ phim</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên..."
                  className="input-cyber"
                  value={movieForm.title}
                  onChange={e => setMovieForm({ ...movieForm, title: e.target.value })}
                />
              </div>
              <div className="input-cyber-group">
                <label>Thời lượng (phút)</label>
                <input
                  type="number"
                  required
                  placeholder="Ví dụ: 120"
                  className="input-cyber"
                  value={movieForm.duration}
                  onChange={e => setMovieForm({ ...movieForm, duration: e.target.value })}
                />
              </div>
              <div className="input-cyber-group">
                <label>Thể loại</label>
                <select
                  required
                  className="input-cyber"
                  value={movieForm.genre_id}
                  onChange={e => setMovieForm({ ...movieForm, genre_id: e.target.value })}
                >
                  <option value="">Chọn một...</option>
                  {genres.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-cyber-group">
                <label>Trạng thái phát hành</label>
                <select
                  className="input-cyber"
                  value={movieForm.status}
                  onChange={e => setMovieForm({ ...movieForm, status: e.target.value })}
                >
                  <option value="Đang chiếu">Đang chiếu</option>
                  <option value="Sắp chiếu">Sắp chiếu</option>
                </select>
              </div>
              <div className="input-cyber-group">
                <label>URL Hình ảnh (Poster)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  className="input-cyber"
                  value={movieForm.image_url}
                  onChange={e => setMovieForm({ ...movieForm, image_url: e.target.value })}
                />
              </div>
              <div className="input-cyber-group">
                <label>Tóm tắt nội dung</label>
                <textarea
                  placeholder="Mô tả phim..."
                  className="input-cyber"
                  rows="3"
                  value={movieForm.description}
                  onChange={e => setMovieForm({ ...movieForm, description: e.target.value })}
                />
              </div>

              {errorMessage && <div style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>❌ {errorMessage}</div>}

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>[ LƯU THÔNG TIN ]</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(null)}>[ HỦY ]</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === 'genre' && (
        <div className="cyber-modal-overlay">
          <div className="glass-panel cyber-modal">
            <div className="modal-header">
              <h3 className="tech-font" style={{ color: '#fff' }}>{editTarget ? '// SỬA THỂ LOẠI' : '// THÊM THỂ LOẠI'}</h3>
              <button className="modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>
            <form onSubmit={handleGenreSubmit} className="checkout-form">
              <div className="input-cyber-group">
                <label>Tên danh mục thể loại</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Khoa học viễn tưởng..."
                  className="input-cyber"
                  value={genreForm.name}
                  onChange={e => setGenreForm({ name: e.target.value })}
                />
              </div>

              {errorMessage && <div style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>❌ {errorMessage}</div>}

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>[ CẬP NHẬT ]</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(null)}>[ QUAY LẠI ]</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === 'showtime' && (
        <div className="cyber-modal-overlay">
          <div className="glass-panel cyber-modal">
            <div className="modal-header">
              <h3 className="tech-font" style={{ color: '#fff' }}>// XẾP LỊCH CHIẾU</h3>
              <button className="modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>
            <form onSubmit={handleShowtimeSubmit} className="checkout-form">
              <div className="input-cyber-group">
                <label>Chọn Phim Chiếu</label>
                <select
                  required
                  className="input-cyber"
                  value={showtimeForm.movie_id}
                  onChange={e => setShowtimeForm({ ...showtimeForm, movie_id: e.target.value })}
                >
                  <option value="">-- Chọn phim --</option>
                  {movies.filter(m => m.status === 'Đang chiếu').map(m => (
                    <option key={m.id} value={m.id}>{m.title} ({m.duration} phút)</option>
                  ))}
                </select>
              </div>
              <div className="input-cyber-group">
                <label>Phòng Chiếu</label>
                <select
                  required
                  className="input-cyber"
                  value={showtimeForm.room_name}
                  onChange={e => setShowtimeForm({ ...showtimeForm, room_name: e.target.value })}
                >
                  <option value="Phòng 01">Phòng 01</option>
                  <option value="Phòng 02">Phòng 02</option>
                  <option value="Phòng 03">Phòng 03</option>
                  <option value="Phòng 04">Phòng 04</option>
                </select>
              </div>
              <div className="input-cyber-group">
                <label>Ngày Chiếu</label>
                <input
                  type="date"
                  required
                  className="input-cyber"
                  value={showtimeForm.show_date}
                  onChange={e => setShowtimeForm({ ...showtimeForm, show_date: e.target.value })}
                />
              </div>
              <div className="input-cyber-group">
                <label>Giờ Bắt Đầu</label>
                <input
                  type="time"
                  required
                  className="input-cyber"
                  value={showtimeForm.start_time}
                  onChange={e => setShowtimeForm({ ...showtimeForm, start_time: e.target.value })}
                />
              </div>
              <div className="input-cyber-group">
                <label>Giá vé đơn (VND)</label>
                <input
                  type="number"
                  required
                  className="input-cyber"
                  value={showtimeForm.ticket_price}
                  onChange={e => setShowtimeForm({ ...showtimeForm, ticket_price: Number(e.target.value) })}
                />
              </div>

              {errorMessage && (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>
                  ❌ {errorMessage}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>[ XẾP LỊCH CHIẾU ]</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(null)}>[ HỦY ]</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === 'booking-detail' && detailBooking && (
        <div className="cyber-modal-overlay">
          <div className="glass-panel cyber-modal">
            <div className="modal-header">
              <h3 className="tech-font" style={{ color: '#fff' }}>// CHI TIẾT GHẾ HÓA ĐƠN #CT-{detailBooking.id}</h3>
              <button className="modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Khách hàng:</span>
                <p style={{ fontWeight: 600 }}>{detailBooking.customer_name} ({detailBooking.phone})</p>
              </div>

              <div style={{ borderTop: '1px dashed var(--border-cyan)', margin: '5px 0' }}></div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Vị trí ghế đã chọn:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                  {detailBooking.items.map(item => (
                    <span
                      key={item.id}
                      className="tech-font"
                      style={{
                        border: '1.5px solid var(--primary)',
                        color: 'var(--primary)',
                        padding: '6px 12px',
                        borderRadius: '30px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        background: 'rgba(0, 245, 212, 0.05)'
                      }}
                    >
                      Seat {item.seat_number}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px dashed var(--border-cyan)', margin: '5px 0' }}></div>

              <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tổng thanh toán:</span>
                <span className="tech-font" style={{ color: 'var(--primary)', fontSize: '1.3rem', fontWeight: 800 }}>
                  {detailBooking.total_price.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }} onClick={() => setShowModal(null)}>
                [ ĐỒNG Ý ]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
