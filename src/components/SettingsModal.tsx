import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Database, 
  Sliders, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Send,
  ExternalLink,
  Shield
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onOpenDocs: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onOpenDocs
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [testingSheet, setTestingSheet] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(formData);
    onClose();
  };

  const handleTestSheetConnection = async () => {
    if (!formData.googleSheetWebAppUrl) {
      setTestResult({ success: false, message: 'Please enter a Google Apps Script Web App URL first.' });
      return;
    }

    setTestingSheet(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/test-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.googleSheetWebAppUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ success: true, message: 'Connection successful! A test row was inserted into your Google Sheet.' });
      } else {
        setTestResult({ success: false, message: data.error || 'Failed to connect to Google Sheet Web App.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Network error while contacting Web App.' });
    } finally {
      setTestingSheet(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Model & Database Configuration</h2>
              <p className="text-xs text-slate-400">Manage Groq parameters and Google Sheet Web App integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm max-h-[75vh] overflow-y-auto">
          
          {/* AI Model Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Groq AI Model
            </label>
            <select
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            >
              <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended - 70B State-of-the-Art)</option>
              <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Ultra-Fast Coding)</option>
              <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 (32k Context Window)</option>
              <option value="gemma2-9b-it">gemma2-9b-it (Google Gemma 2)</option>
            </select>
            <p className="text-[11px] text-slate-400">
              In production, the backend communicates with Groq via <code>GROQ_API_KEY</code> on Vercel.
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Temperature: <span className="text-blue-400 font-mono">{formData.temperature}</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {formData.temperature <= 0.3 ? 'Deterministic / Precise Code' : 'Creative Exploration'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Google Spreadsheet Sync */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white text-xs uppercase tracking-wider">Google Spreadsheet Database</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDocs();
                }}
                className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Setup Guide</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Google Apps Script Web App URL:
              </label>
              <input
                type="url"
                value={formData.googleSheetWebAppUrl}
                onChange={(e) => setFormData({ ...formData, googleSheetWebAppUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoLogToSheet}
                  onChange={(e) => setFormData({ ...formData, autoLogToSheet: e.target.checked })}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0 w-4 h-4"
                />
                <span>Automatically log every conversation to Sheet</span>
              </label>

              <button
                type="button"
                onClick={handleTestSheetConnection}
                disabled={testingSheet || !formData.googleSheetWebAppUrl}
                className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition cursor-pointer"
              >
                {testingSheet ? (
                  <div className="w-3 h-3 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                <span>Test Connection</span>
              </button>
            </div>

            {testResult && (
              <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${testResult.success ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300' : 'bg-red-950/40 border border-red-800/60 text-red-300'}`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-950/20 border border-blue-800/30 text-xs text-slate-300">
            <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              <strong>Security Guarantee:</strong> Your <code>GROQ_API_KEY</code> is never exposed on the frontend. It is kept secure inside Vercel's serverless environment.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>

      </div>
    </div>
  );
};
