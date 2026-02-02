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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-300 border border-slate-100">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-50 rounded-full">
              <Wifi size={40} className="text-blue-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Connect to Server</h2>
          <p className="text-slate-500">Enter the server URL displayed on your Desktop App</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Server URL</label>
            <input 
              type="text" 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
              placeholder="http://192.168.x.x:5000"
              required 
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 placeholder:text-slate-400"
            />
          </div>
          <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95">
            <Save size={18} />
            Connect
          </button>
        </form>
      </div>
    </div>
  );
}

export default ConnectServer;
