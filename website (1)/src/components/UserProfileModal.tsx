import React, { useState } from 'react';
import { X, ShieldCheck, Key, Lock, Sparkles, Save } from 'lucide-react';
import { UserProfile } from '../types';
import { dbService } from '../services/db';
import { encryptData, decryptData } from '../services/security';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUpdate: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdate
}) => {
  const [privateNote, setPrivateNote] = useState('');
  const [decryptedNote, setDecryptedNote] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !user) return null;

  const handleSaveEncryptedNote = async () => {
    if (!privateNote.trim()) return;
    setIsSaving(true);
    setStatusMessage('Mengenkripsi catatan pribadi dengan algoritma AES-256-GCM...');

    try {
      const { cipherText, iv } = await encryptData(privateNote, user.salt, user.id);
      dbService.updateUserProfile({
        encryptedNotes: cipherText,
        encryptedNotesIv: iv
      });
      setDecryptedNote(privateNote);
      setStatusMessage('Catatan berhasil dienkripsi dan disimpan secara aman ke database!');
      onUpdate();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Gagal mengenkripsi catatan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDecryptExisting = async () => {
    if (!user.encryptedNotes || !user.encryptedNotesIv) return;
    setStatusMessage('Mendekripsi data dengan kunci turunan sesi pengguna...');
    try {
      const text = await decryptData(user.encryptedNotes, user.encryptedNotesIv, user.salt, user.id);
      setDecryptedNote(text);
      setPrivateNote(text);
      setStatusMessage('Dekripsi sukses! Teks asli dipulihkan dari cipher.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Dekripsi gagal.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto font-mono-code text-xs">
      <div className="bg-[bg-white] border-2 border-[#E0DED9] max-w-lg w-full p-6 text-[#2C2C2C] relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#888888] hover:text-[#2C2C2C] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-4 border-b border-[#E0DED9] pb-4 mb-5">
          <div className="w-14 h-14 border-2 border-[#E0DED9] bg-[bg-[#F8F7F4]] flex items-center justify-center text-3xl shrink-0">
            {user.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#2C2C2C] uppercase">{user.name}</h3>
              <span className={`text-[9px] uppercase px-1.5 py-0.2 font-bold border ${
                user.role === 'guru' 
                  ? 'border-amber-400/40 bg-amber-950/20 text-amber-300' 
                  : 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              }`}>
                {user.role}
              </span>
            </div>
            <p className="text-xs text-[#666666] font-mono-code mt-0.5">{user.email}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-[#666666] font-mono-code">
              <span className="flex items-center gap-1 text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                {user.totalStars} Bintang
              </span>
              <span>•</span>
              <span className="text-[#444444]">{user.level}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-5 font-mono-code text-xs">
          <div className="border-2 border-[#E0DED9] bg-[bg-[#FFFDF9]] p-2.5 text-center">
            <span className="text-[10px] text-[#888888] uppercase block">Bab Selesai</span>
            <span className="text-base font-bold text-[#2C2C2C]">{user.completedLessons.length} / 15</span>
          </div>
          <div className="border-2 border-[#E0DED9] bg-[bg-[#FFFDF9]] p-2.5 text-center">
            <span className="text-[10px] text-[#888888] uppercase block">Workbook</span>
            <span className="text-base font-bold text-[#2C2C2C]">{user.completedWorkbook.length} / 15</span>
          </div>
          <div className="border-2 border-[#E0DED9] bg-[bg-[#FFFDF9]] p-2.5 text-center">
            <span className="text-[10px] text-[#888888] uppercase block">Streak Hari</span>
            <span className="text-base font-bold text-[#2C2C2C]">{user.streakDays} Hari 🔥</span>
          </div>
        </div>

        {/* Encryption & Security Specs */}
        <div className="border-2 border-[#E0DED9] bg-[bg-[#FFFDF9]] p-3.5 space-y-2 mb-5 font-mono-code">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Status Keamanan &amp; Enkripsi</span>
            </span>
            <span className="text-[9px] border border-emerald-500/40 bg-emerald-950/20 text-emerald-300 px-1.5 py-0.2 font-bold uppercase tracking-wider">
              AKTIF
            </span>
          </div>
          <div className="text-[11px] text-[#666666] space-y-1">
            <div className="truncate">
              <span className="text-[#888888]">Salt Kriptografis: </span>
              <span className="text-amber-400">{user.salt.substring(0, 16)}...</span>
            </div>
            <div className="truncate">
              <span className="text-[#888888]">Hash Kata Sandi: </span>
              <span className="text-[#444444]">PBKDF2-SHA256 (100k rounds)</span>
            </div>
            <div className="truncate">
              <span className="text-[#888888]">Enkripsi Profil: </span>
              <span className="text-emerald-400">AES-256-GCM Authenticated</span>
            </div>
          </div>
        </div>

        {/* AES-256 Vault / Notes Demo */}
        <div className="space-y-2 border-t border-[#E0DED9] pt-3">
          <div className="flex justify-between items-center">
            <label className="text-xs text-[#444444] flex items-center gap-1.5 uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Brankas Catatan Pribadi (AES-256)</span>
            </label>
            {user.encryptedNotes && (
              <button
                onClick={handleDecryptExisting}
                className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 uppercase"
              >
                <Key className="w-3 h-3" />
                <span>Dekripsi</span>
              </button>
            )}
          </div>

          <textarea
            rows={2}
            value={privateNote}
            onChange={(e) => setPrivateNote(e.target.value)}
            placeholder="Tulis catatan pribadi siswa/guru di sini untuk diuji enkripsi AES-256..."
            className="w-full text-xs p-2.5 bg-white border-2 border-[#E0DED9] text-[#2C2C2C] focus:outline-none focus:border-zinc-400"
          />

          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#888888] truncate max-w-xs">
              {user.encryptedNotes ? `Ciphertext: ${user.encryptedNotes.substring(0, 20)}...` : 'Belum ada catatan terenkripsi.'}
            </span>
            <button
              onClick={handleSaveEncryptedNote}
              disabled={isSaving || !privateNote.trim()}
              className="bg-[#FFB703] hover:bg-[#F0A500] disabled:opacity-30 text-[#2C2C2C] font-bold text-xs uppercase px-3 py-1.5 transition flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Menyimpan...' : 'Enkripsi & Simpan'}</span>
            </button>
          </div>

          {statusMessage && (
            <p className="text-[11px] text-[#444444] border-2 border-[#E0DED9] bg-white p-2 mt-1">
              {statusMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
