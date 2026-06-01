import React, { useState, useEffect } from 'react';

export default function CustomerPortal({ addToCart }) {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [showtimes, setShowtimes] = useState([]);

  // Filters state
  const [selectedGenreId, setSelectedGenreId] = useState('');
  const [searchTitle, setSearchTitle] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Selection state
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const [errorMessage, setErrorMessage] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetch('/api/movies')
      .then(res => res.json())
      .then(data => setMovies(data))
      .catch(err => console.error(err));

    fetch('/api/genres')
      .then(res => res.json())
      .then(data => setGenres(data))
      .catch(err => console.error(err));
  }, []);

  // Fetch showtimes
  useEffect(() => {
    fetch('/api/showtimes')
      .then(res => res.json())
      .then(data => setShowtimes(data))
      .catch(err => console.error(err));
  }, []);

  // Fetch occupied seats when showtime changes
  useEffect(() => {
    if (selectedShowtime) {
      fetch(`/api/showtimes/${selectedShowtime.id}/seats`)
        .then(res => res.json())
        .then(data => {
          setOccupiedSeats(data.occupiedSeats || []);
          setSelectedSeats([]); // reset seats
        })
        .catch(err => console.error(err));
    }
  }, [selectedShowtime]);

  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
    setSelectedDate('');
    setSelectedShowtime(null);
    setOccupiedSeats([]);
    setSelectedSeats([]);
    setErrorMessage('');
  };

  const handleBackToCatalog = () => {
    setSelectedMovie(null);
    setSelectedDate('');
    setSelectedShowtime(null);
    setOccupiedSeats([]);
    setSelectedSeats([]);
    setErrorMessage('');
  };

  const getMovieShowDates = () => {
    if (!selectedMovie) return [];
    const movieShowtimes = showtimes.filter(s => s.movie_id === selectedMovie.id);
    const dates = [...new Set(movieShowtimes.map(s => s.show_date))];
    return dates.sort();
  };

  const getAvailableShowtimes = () => {
    if (!selectedMovie || !selectedDate) return [];
    return showtimes.filter(s => s.movie_id === selectedMovie.id && s.show_date === selectedDate);
  };

  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const columns = [1, 2, 3, 4, 5, 6, 7, 8];

  const handleSeatClick = (seatCode) => {
    if (occupiedSeats.includes(seatCode)) return;
    if (selectedSeats.includes(seatCode)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatCode));
    } else {
      setSelectedSeats([...selectedSeats, seatCode]);
    }
  };

  const handleAddToCartClick = () => {
    if (selectedSeats.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một ghế ngồi!');
      return;
    }
    
    // Pass items to global cart state
    addToCart({
      movie: selectedMovie,
      showtime: selectedShowtime,
      date: selectedDate,
      seats: selectedSeats
    });

    // Reset current selection state for next booking
    setSelectedSeats([]);
    setErrorMessage('');
  };

  const filteredMovies = movies.filter(movie => {
    if (searchTitle && !movie.title.toLowerCase().includes(searchTitle.toLowerCase())) return false;
    if (selectedGenreId && movie.genre_id !== Number(selectedGenreId)) return false;
    if (filterDate) {
      const hasShowtimeOnDate = showtimes.some(s => s.movie_id === movie.id && s.show_date === filterDate);
      if (!hasShowtimeOnDate) return false;
    }
    return true;
  });

  return (
    <div>
      {!selectedMovie ? (
        // HORIZONTAL CATALOG VIEW
        <div>
          <div className="glass-panel filters-bar">
            <div className="input-cyber-group">
              <label>Tìm kiếm phim</label>
              <input
                type="text"
                placeholder="Nhập tên phim cần tìm..."
                className="input-cyber"
                value={searchTitle}
                onChange={e => setSearchTitle(e.target.value)}
              />
            </div>

            <div className="input-cyber-group">
              <label>Thể loại</label>
              <select
                className="input-cyber"
                value={selectedGenreId}
                onChange={e => setSelectedGenreId(e.target.value)}
              >
                <option value="">Tất cả các thể loại</option>
                {genres.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="input-cyber-group">
              <label>Ngày chiếu</label>
              <input
                type="date"
                className="input-cyber"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
              />
            </div>

            {(searchTitle || selectedGenreId || filterDate) && (
              <button className="btn btn-secondary" onClick={() => {
                setSearchTitle('');
                setSelectedGenreId('');
                setFilterDate('');
              }}>
                🧹 Xóa bộ lọc
              </button>
            )}
          </div>

          <h2 style={{ marginBottom: '30px', fontSize: '1.6rem', borderBottom: '3px solid var(--border-cute)', paddingBottom: '10px' }}>
            🍿 Danh Sách Phim Đang Chiếu
          </h2>

          {filteredMovies.length === 0 ? (
            <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Không tìm thấy phim phù hợp với yêu cầu lọc của bạn.
            </div>
          ) : (
            <div className="movies-horizontal-list">
              {filteredMovies.map(movie => (
                <div key={movie.id} className="glass-panel movie-row-card">
                  <div className="movie-row-poster-container">
                    <img
                      src={movie.image_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'}
                      alt={movie.title}
                      className="movie-row-poster"
                    />
                    <div className="movie-row-badge">{movie.status}</div>
                  </div>
                  <div className="movie-row-details">
                    <div>
                      <div className="movie-row-header">
                        <h3 className="movie-row-title">{movie.title}</h3>
                        <span className="movie-meta-item">{movie.genre_name}</span>
                      </div>
                      <div style={{ marginTop: '10px' }}>
                        <span className="movie-meta-item">🕒 {movie.duration} phút</span>
                      </div>
                      <p className="movie-row-desc">{movie.description}</p>
                    </div>
                    <div>
                      <button onClick={() => handleMovieSelect(movie)} className="btn btn-primary">
                        🌸 Đặt vé ngay
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // DETAILED BOOKING VIEW
        <div>
          <button onClick={handleBackToCatalog} className="btn btn-secondary" style={{ marginBottom: '30px' }}>
            🌸 Quay lại xem phim
          </button>

          <div className="booking-flow-container">
            <div>
              <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
                <div className="movie-detail-summary">
                  <img
                    src={selectedMovie.image_url}
                    alt={selectedMovie.title}
                    className="detail-poster"
                    style={{ borderColor: 'var(--border-cute)', borderWidth: '3px', borderRadius: '18px' }}
                  />
                  <div>
                    <span className="movie-meta-item" style={{ color: 'var(--text-main)', borderColor: 'var(--primary)' }}>{selectedMovie.genre_name}</span>
                    <h2 style={{ fontSize: '2rem', margin: '15px 0 10px 0', color: 'var(--text-main)' }}>{selectedMovie.title}</h2>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px', fontWeight: 600 }}>🕒 Thời lượng: {selectedMovie.duration} phút</div>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '0.95rem' }}>{selectedMovie.description}</p>
                  </div>
                </div>

                {selectedMovie.status === 'Sắp chiếu' ? (
                  <div className="glass-panel" style={{ padding: '25px', borderColor: 'var(--danger)', background: 'var(--bg-panel)', color: 'var(--text-main)' }}>
                    🌸 Bộ phim này hiện chưa công chiếu chính thức. Trạng thái hiện tại: Sắp chiếu.
                  </div>
                ) : (
                  <>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '15px', borderBottom: '3px solid var(--border-cute)', paddingBottom: '8px' }}>
                      🌸 Bước 1: Chọn Ngày Chiếu
                    </h3>
                    {getMovieShowDates().length === 0 ? (
                      <p style={{ color: 'var(--text-muted)' }}>Chưa có lịch chiếu khả dụng.</p>
                    ) : (
                      <div className="date-selector">
                        {getMovieShowDates().map(date => {
                          const dateObj = new Date(date);
                          const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                          return (
                            <div
                              key={date}
                              className={`date-card ${selectedDate === date ? 'active' : ''}`}
                              onClick={() => {
                                setSelectedDate(date);
                                setSelectedShowtime(null);
                                setSelectedSeats([]);
                              }}
                            >
                              <div className="date-day">{dayNames[dateObj.getDay()]}</div>
                              <div className="date-num">{dateObj.getDate()}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedDate && (
                      <>
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: '25px 0 15px 0', borderBottom: '3px solid var(--border-cute)', paddingBottom: '8px' }}>
                          🌸 Bước 2: Chọn Giờ Chiếu
                        </h3>
                        <div className="time-slots">
                          {getAvailableShowtimes().map(st => (
                            <div
                              key={st.id}
                              className={`time-card ${selectedShowtime?.id === st.id ? 'active' : ''}`}
                              onClick={() => setSelectedShowtime(st)}
                            >
                              <div>{st.start_time}</div>
                              <span className="room-lbl">{st.room_name}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {selectedShowtime && (
                      <>
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: '25px 0 15px 0', borderBottom: '3px solid var(--border-cute)', paddingBottom: '8px' }}>
                          🌸 Bước 3: Chọn Ghế Ngồi Xinh Xắn
                        </h3>
                        <div className="glass-panel" style={{ padding: '40px 10px' }}>
                          <div className="theater-screen-arc"></div>
                          <div className="theater-screen-text">🎬 Màn hình chiếu</div>

                          <div className="seating-curve-wrapper">
                            {rows.map(row => (
                              <div key={row} className="seating-row-arc">
                                {columns.map(col => {
                                  const seatCode = `${row}${col}`;
                                  const isOccupied = occupiedSeats.includes(seatCode);
                                  const isSelected = selectedSeats.includes(seatCode);
                                  return (
                                    <div
                                      key={seatCode}
                                      onClick={() => handleSeatClick(seatCode)}
                                      className={`cyber-seat ${isOccupied ? 'occupied' : ''} ${isSelected ? 'selected' : ''}`}
                                    >
                                      {seatCode}
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>

                          <div className="cyber-legend">
                            <div className="legend-item">
                              <div className="cyber-seat" style={{ cursor: 'default' }}></div>
                              <span>Còn trống</span>
                            </div>
                            <div className="legend-item">
                              <div className="cyber-seat selected" style={{ cursor: 'default' }}></div>
                              <span>Đang chọn</span>
                            </div>
                            <div className="legend-item">
                              <div className="cyber-seat occupied" style={{ cursor: 'default' }}></div>
                              <span>Đã đặt</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sidebar Cart Add */}
            <div className="glass-panel checkout-card">
              <h3 style={{ fontSize: '1.2rem', borderBottom: '3px solid var(--border-cute)', paddingBottom: '10px', marginBottom: '20px', color: 'var(--text-main)' }}>
                📋 Chi tiết lựa chọn
              </h3>

              {selectedShowtime ? (
                <div>
                  <div className="checkout-summary-row">
                    <span>Phim:</span>
                    <span>{selectedMovie.title}</span>
                  </div>
                  <div className="checkout-summary-row">
                    <span>Suất chiếu:</span>
                    <span>{selectedDate} @ {selectedShowtime.start_time}</span>
                  </div>
                  <div className="checkout-summary-row">
                    <span>Phòng chiếu:</span>
                    <span>{selectedShowtime.room_name}</span>
                  </div>
                  <div className="checkout-summary-row">
                    <span>Giá vé:</span>
                    <span>{selectedShowtime.ticket_price.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="checkout-summary-row">
                    <span>Ghế chọn:</span>
                    <span style={{ color: 'var(--primary-hover)' }}>
                      {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn'}
                    </span>
                  </div>

                  <div className="checkout-total" style={{ borderBottom: '3px dashed var(--border-cute)', paddingBottom: '15px', marginBottom: '15px' }}>
                    <span className="total-lbl">Tạm tính:</span>
                    <span className="total-val" style={{ color: 'var(--primary-hover)' }}>
                      {(selectedShowtime.ticket_price * selectedSeats.length).toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {errorMessage && (
                    <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>
                      ❌ {errorMessage}
                    </div>
                  )}

                  <button
                    onClick={handleAddToCartClick}
                    disabled={selectedSeats.length === 0}
                    className={`btn btn-primary ${selectedSeats.length === 0 ? 'btn-disabled' : ''}`}
                    style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                  >
                    🛒 Thêm Vào Giỏ Hàng
                  </button>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                  Chọn suất chiếu & ghế để thêm vào giỏ hàng xinh nhé.
                  
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
