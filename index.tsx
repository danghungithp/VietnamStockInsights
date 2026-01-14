
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
    
    // Xóa loader sau khi React mount thành công
    const loader = document.getElementById('app-loader');
    if (loader) {
      setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
      }, 300);
    }
  } catch (err: any) {
    console.error("React Render Error:", err);
    rootElement.innerHTML = `
      <div style="padding: 60px 20px; text-align: center; color: white; background: #0f172a; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.2); padding: 30px; border-radius: 20px; max-width: 500px;">
          <i class="fa-solid fa-bug" style="color: #f43f5e; font-size: 40px; margin-bottom: 20px;"></i>
          <h2 style="font-size: 24px; margin-bottom: 10px;">Lỗi Khởi Chạy Hệ Thống</h2>
          <p style="color: #94a3b8; margin-bottom: 20px; font-size: 14px; line-height: 1.6;">
            Ứng dụng không thể khởi động do lỗi môi trường trình duyệt. Điều này thường liên quan đến các tiện ích mở rộng can thiệp vào mã nguồn.
          </p>
          <div style="background: #020617; padding: 15px; border-radius: 8px; text-align: left; margin-bottom: 20px; overflow-x: auto;">
             <code style="color: #f43f5e; font-size: 11px;">${err.message || "Unknown error occurred"}</code>
          </div>
          <button onclick="window.location.reload()" style="background: #3b82f6; color: white; border: none; padding: 12px 30px; border-radius: 12px; cursor: pointer; font-weight: bold; transition: all 0.2s;">
            <i class="fa-solid fa-rotate-right" style="margin-right: 8px;"></i> Thử Tải Lại Ngay
          </button>
        </div>
      </div>
    `;
  }
}
