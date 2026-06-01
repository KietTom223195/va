import React, { useState } from 'react';

export default function CartPortal({ cart, removeFromCart, clearCart, setPortal }) {
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '' });
  const [bookingResults, setBookingResults] = useState(null); // hold successful bookings
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.showtime.ticket_price * item.seats.length), 0);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!customerForm.name || !customerForm.phone || !customerForm.email) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin cá nhân!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const results = [];
      // Loop sequentially or concurrently through cart items
      for (const item of cart) {
        const payload = {
          customer_name: customerForm.name,
          phone: customerForm.phone,
          email: customerForm.email,
          showtime_id: item.showtime.id,
          seats: item.seats
        };

        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Đặt vé cho phim "${item.movie.title}" bị lỗi`);
        }
        results.push(data);
      }

      setBookingResults(results);
      clearCart(); // success, clear global cart state
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (bookingResults) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <span style={{ fontSize: '3rem' }}>🎉</span>
          <h2 style={{ color: 'var(--primary-hover)', marginTop: '15px' }}>Đặt Vé Thành Công!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '5px' }}>
            Chúc mừng bạn! Tất cả hóa đơn đã được xử lý an toàn.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {bookingResults.map((booking, idx) => {
            // Find matching movie details from original cart items if needed, or read from receipt response
            return (
              <div key={idx} className="futuristic-receipt">
                <div className="receipt-header">
                  <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)' }}>Hóa Đơn #{idx + 1}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>MÃ VÉ: #CT-{booking.id}</span>
                </div>

                <div className="receipt-grid">
                  <div className="receipt-cell">
                    <label>Khách hàng</label>
                    <span>{booking.customer_name}</span>
                  </div>
                  <div className="receipt-cell">
                    <label>Số điện thoại</label>
                    <span>{booking.phone}</span>
                  </div>
                  <div className="receipt-cell" style={{ gridColumn: 'span 2' }}>
                    <label>Vị trí ghế đã chọn</label>
                    <span style={{ color: 'var(--primary-hover)', fontSize: '1.25rem', letterSpacing: '1px' }}>
                      {booking.seats.join(', ')}
                    </span>
                  </div>
                  <div className="receipt-cell">
                    <label>Tổng thanh toán</label>
                    <span style={{ color: 'var(--primary-hover)', fontSize: '1.2rem' }}>
                      {booking.total_price.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="receipt-cell">
                    <label>Trạng thái vé</label>
                    <span className="tag-status tag-warning" style={{ alignSelf: 'flex-start' }}>{booking.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button onClick={() => setPortal('customer')} className="btn btn-primary">
            🌸 Quay Lại Chọn Phim Khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '30px', fontSize: '1.6rem', borderBottom: '3px solid var(--border-cute)', paddingBottom: '10px' }}>
        🛒 Giỏ Hàng Xinh Của Bạn
      </h2>

      {cart.length === 0 ? (
        <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '15px' }}>🧁</span>
          Giỏ hàng của bạn đang trống trơn kìa...
          <div style={{ marginTop: '20px' }}>
            <button onClick={() => setPortal('customer')} className="btn btn-primary">
              🌸 Đi Xem Phim Ngay
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', alignItems: 'start' }}>
          {/* Cart list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {cart.map(item => (
              <div key={item.cartItemId} className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <img
                  src={item.movie.image_url}
                  alt={item.movie.title}
                  style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '12px', border: '2px solid var(--border-cute)' }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{item.movie.title}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 600 }}>
                    📅 Ngày chiếu: {item.date} | 🕒 Suất: {item.showtime.start_time} | 🚪 {item.showtime.room_name}
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <span className="movie-meta-item" style={{ color: 'var(--primary-hover)', borderColor: 'var(--primary)' }}>
                      Ghế: {item.seats.join(', ')}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '120px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '15px' }}>
                    {(item.showtime.ticket_price * item.seats.length).toLocaleString('vi-VN')} đ
                  </div>
                  <button onClick={() => removeFromCart(item.cartItemId)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout sidebar */}
          <div className="glass-panel" style={{ padding: '25px' }}>
            <h3 style={{ fontSize: '1.2rem', borderBottom: '3px solid var(--border-cute)', paddingBottom: '10px', marginBottom: '20px' }}>
              💳 Trang Thanh Toán
            </h3>

            <div className="checkout-summary-row" style={{ fontSize: '1rem', marginBottom: '15px' }}>
              <span>Số lượng suất đặt:</span>
              <span>{cart.length} đơn</span>
            </div>

            <div className="checkout-total" style={{ borderTop: '3px dashed var(--border-cute)', paddingTop: '15px', marginTop: '15px' }}>
              <span className="total-lbl">TỔNG CỘNG:</span>
              <span className="total-val" style={{ color: 'var(--primary-hover)' }}>
                {calculateTotal().toLocaleString('vi-VN')} đ
              </span>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="checkout-form">
              <div className="input-cyber-group">
                <label>Họ tên khách hàng</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên nhận vé..."
                  className="input-cyber"
                  value={customerForm.name}
                  onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                />
              </div>
              <div className="input-cyber-group">
                <label>Số điện thoại</label>
                <input
                  type="tel"
                  required
                  placeholder="Số liên lạc..."
                  className="input-cyber"
                  value={customerForm.phone}
                  onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                />
              </div>
              <div className="input-cyber-group">
                <label>Địa chỉ Email</label>
                <input
                  type="email"
                  required
                  placeholder="Địa chỉ Email..."
                  className="input-cyber"
                  value={customerForm.email}
                  onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                />
              </div>

              {errorMessage && (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600, marginTop: '10px' }}>
                  ❌ {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}
              >
                {isSubmitting ? 'Đang xử lý...' : '💖 Xác nhận thanh toán'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
