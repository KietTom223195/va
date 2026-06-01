import React, { useState } from 'react';
import CustomerPortal from './components/CustomerPortal';
import AdminPortal from './components/AdminPortal';
import CartPortal from './components/CartPortal';

function App() {
  const [portal, setPortal] = useState('customer'); // 'customer', 'cart', 'admin'
  const [cart, setCart] = useState([]); // Shared cart state

  const addToCart = (cartItem) => {
    // Generate a temporary unique ID
    const itemWithId = { ...cartItem, cartItemId: Date.now() + Math.random().toString(36).substr(2, 9) };
    setCart([...cart, itemWithId]);
    setPortal('cart'); // Automatically navigate to the Cart page to view it
  };

  const removeFromCart = (cartItemId) => {
    setCart(cart.filter(item => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <div className="app-container">
      {/* Cute Sidebar Nav */}
      <aside className="sidebar-nav">
        <div className="brand-section">
          <div className="brand-logo">
            <span>🍓</span> Tiệm Vé Cine
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 600 }}>
            HỆ THỐNG ĐẶT VÉ CỦA BẠN
          </div>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-link-btn ${portal === 'customer' ? 'active' : ''}`}
            onClick={() => setPortal('customer')}
          >
            <span style={{ fontSize: '1.2rem' }}>🍿</span> Xem Phim & Chọn Vé
          </button>
          
          <button
            className={`nav-link-btn ${portal === 'cart' ? 'active' : ''}`}
            onClick={() => setPortal('cart')}
            style={{ position: 'relative' }}
          >
            <span style={{ fontSize: '1.2rem' }}>🛒</span> Giỏ Hàng Xinh
            {cart.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '12px',
                background: 'var(--primary-hover)',
                color: '#fff',
                borderRadius: '50%',
                padding: '2px 8px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {cart.length}
              </span>
            )}
          </button>

          <button
            className={`nav-link-btn ${portal === 'admin' ? 'active' : ''}`}
            onClick={() => setPortal('admin')}
          >
            <span style={{ fontSize: '1.2rem' }}>⚙️</span> Quản Trị Rạp
          </button>
        </nav>

        <div className="nav-footer">
          <div style={{ fontWeight: 'bold' }}>🍿 Chào mừng quý khách!</div>
          <div style={{ color: 'var(--primary-hover)', marginTop: '4px', fontSize: '0.75rem' }}>PHIÊN BẢN ĐÁNG YÊU V1.1</div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        {portal === 'customer' && (
          <CustomerPortal addToCart={addToCart} />
        )}
        {portal === 'cart' && (
          <CartPortal cart={cart} removeFromCart={removeFromCart} clearCart={clearCart} setPortal={setPortal} />
        )}
        {portal === 'admin' && (
          <AdminPortal />
        )}
      </main>
    </div>
  );
}

export default App;
