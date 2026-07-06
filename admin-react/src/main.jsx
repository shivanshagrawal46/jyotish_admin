import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntdApp, theme as antdTheme } from 'antd';
import 'antd/dist/reset.css';
import 'react-quill-new/dist/quill.snow.css';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

const theme = {
  token: {
    colorPrimary: '#5b3fb3',
    colorInfo: '#5b3fb3',
    borderRadius: 10,
    fontSize: 14,
  },
  algorithm: antdTheme.defaultAlgorithm,
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider theme={theme}>
      <AntdApp>
        <BrowserRouter basename="/admin">
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>
);
