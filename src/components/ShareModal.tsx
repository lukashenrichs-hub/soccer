import React, { useState } from 'react';
import { Check, Copy, Download, RefreshCw, Send, Share2, Upload, X } from 'lucide-react';
import { AppData } from '../types';
import { generateWhatsAppReport } from '../utils/stats';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData;
  onResetSeed: () => Promise<any>;
  onImportData: (data: Partial<AppData>) => Promise<any>;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  data,
  onResetSeed,
  onImportData,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  // Ensure public share URL (ais-pre-...) so teammates don't get 403 Forbidden!
  const currentUrl = window.location.href.includes('ais-dev-')
    ? window.location.href.replace('ais-dev-', 'ais-pre-')
    : window.location.href;

  const whatsappReport = generateWhatsAppReport(data);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyWhatsapp = async () => {
    try {
      await navigator.clipboard.writeText(whatsappReport);
      setCopiedWhatsapp(true);
      setTimeout(() => setCopiedWhatsapp(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hallenfussball-stats-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        await onImportData(parsed);
        onClose();
      } catch (err) {
        alert('Fehler beim Parsen der JSON-Datei.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    try {
      setIsResetting(true);
      await onResetSeed();
      setShowResetConfirm(false);
      onClose();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
              <Share2 className="w-3.5 h-3.5" />
              <span>LINK TEILEN & EXPORT</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Mitspieler einladen
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Sende diesen Link in eure Gruppe. Jeder kann live eintragen und mitverfolgen!
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-5">
          {/* Direct URL Share Box */}
          <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">
              Web-Link für die Mitspieler
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shrink-0 min-h-[38px] ${
                  copiedLink
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-sm'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Kopiert!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Kopieren</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-emerald-400/90 font-medium">
              ⚡ Öffentlicher Link: Funktioniert für alle Mitspieler ohne Google-Login (kein Fehler 403 mehr).
            </p>
          </div>

          {/* WhatsApp Text Export */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                WhatsApp Spieltags-Bericht
              </span>
              <button
                onClick={handleCopyWhatsapp}
                className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
              >
                {copiedWhatsapp ? 'Text kopiert! ✓' : 'Bericht kopieren'}
              </button>
            </div>
            <textarea
              readOnly
              rows={4}
              value={whatsappReport}
              className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono resize-none focus:outline-none"
            />
            <button
              onClick={handleCopyWhatsapp}
              className="w-full py-2 text-xs font-semibold text-white bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedWhatsapp ? 'In Zwischenablage kopiert! ✓' : 'WhatsApp-Text kopieren'}</span>
            </button>
          </div>

          {/* Data Backup & Restore */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Sicherung & Verwaltung
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportJson}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Backup herunterladen (JSON)</span>
              </button>

              <label className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Backup einspielen</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>

              <a
                href="/download-zip"
                download="vtv-freier-grund-kick.zip"
                className="px-3.5 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/90 rounded-xl border border-emerald-700/80 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>📦 Projekt als ZIP herunterladen (für Render/Vercel)</span>
              </a>
            </div>

            {/* Render 100% Free Hosting Note */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1 text-slate-300">
              <span className="font-semibold text-emerald-400 block">
                🚀 Eigenes kostenloses Web-Hosting ohne Google-Login:
              </span>
              <p className="text-[11px] text-slate-400">
                1. Lade das Projekt oben als ZIP herunter.<br />
                2. Erstelle einen kostenlosen Account auf <strong>render.com</strong> oder <strong>github.com</strong>.<br />
                3. Lade die Dateien hoch $\rightarrow$ Deine App bekommt eine eigene Web-Adresse (z. B. <em>vtv-kick.onrender.com</em>) und öffnet sich für jeden Apple- und Android-User direkt ohne Google-Abfrage!
              </p>
            </div>

            {/* Reset to 12 original players */}
            <div className="pt-2">
              {showResetConfirm ? (
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl space-y-2">
                  <p className="text-xs text-rose-200">
                    Möchtest du wirklich alle Spiele löschen und die 12 Original-Spieler neu anlegen?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReset}
                      disabled={isResetting}
                      className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white hover:bg-rose-500 rounded-lg"
                    >
                      Ja, alles zurücksetzen
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Auf Standard-Spielerkader (12 Spieler) zurücksetzen</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-medium text-slate-300 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors min-h-[40px]"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
