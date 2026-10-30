# 安全說明

- 使用者的票、照片、影片、錄音只存在使用者自己裝置的瀏覽器（IndexedDB），本專案沒有伺服器、沒有帳號資料庫。
- 儲存庫中不放任何個人照片、測試資料、密碼或 API 金鑰（見 `.gitignore`）。
- 網頁以 Content-Security-Policy 限制只能載入本站檔案、地圖元件 CDN 與 Google Fonts。
- 匯入照片時會重新繪製，移除 EXIF（GPS 位置、拍攝裝置）。

發現安全問題請透過 GitHub 的 **Security → Report a vulnerability** 私下回報，不要開公開 issue。
