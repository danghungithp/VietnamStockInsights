
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Critical: Root element not found");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("Failed to render React app:", err);
    rootElement.innerHTML = `
      <div style="padding: 40px; text-align: center; color: white; background: #0f172a; height: 100vh;">
        <h2 style="color: #f43f5e">Ứng dụng gặp lỗi khi khởi động</h2>
        <p style="color: #94a3b8">Vui lòng kiểm tra console trình duyệt hoặc thử tắt các tiện ích chặn quảng cáo.</p>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; border: none; border-radius: 8px; color: white; cursor: pointer;">
          Tải lại trang
        </button>
      </div>
    `;
  }
}
