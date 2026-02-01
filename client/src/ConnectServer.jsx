import React, { useState } from 'react';
import { setServerUrl } from './api';
import { Wifi, Save } from 'lucide-react';

function ConnectServer() {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url) {
      // Add http if missing
      let finalUrl = url;
      if (!finalUrl.startsWith('http')) {
        finalUrl = `http://${finalUrl}`;
      }
      setServerUrl(finalUrl);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <Wifi size={40} color="#3b82f6" />
          <h2>Connect to Server</h2>
          <p>Enter the server URL displayed on your Desktop App</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Server URL</label>
            <input 
              type="text" 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
              placeholder="http://192.168.x.x:5000"
              required 
              autoFocus
            />
          </div>
          <button type="submit" className="login-btn">
            <Save size={18} />
            Connect
          </button>
        </form>
      </div>
    </div>
  );
}

export default ConnectServer;
