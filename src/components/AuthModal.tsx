import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, KeyRound, School } from 'lucide-react';
import { dbService } from '../services/db';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'siswa' | 'guru'>('siswa');
  const [kelas, setKelas] = useState('Kelas 7 (GCC)');
  const [customKelas, setCustomKelas] = useState('');
  const [isCustomKelas, setIsCustomKelas] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [encryptionStatus, setEncryptionStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) {
          setError('Harap masukkan nama lengkap.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Kata sandi minimal 6 karakter.');
          setLoading(false);
          return;
        }

        const finalKelas = role === 'guru' 
          ? 'Guru / Pengajar' 
          : (isCustomKelas ? customKelas.trim() || 'Kelas Umum' : kelas);

        setEncryptionStatus('Membuat Unique Salt & Hash PBKDF2-SHA256 (100.000 iterasi)...');
        const res = await dbService.registerUser(name.trim(), email.trim(), password, role, finalKelas);
        if (res.success && res.user) {
          setEncryptionStatus('Akun terenkripsi dan tersimpan aman di basis data!');
          setTimeout(() => {
            onSuccess(res.user!);
            onClose();
          }, 600);
        } else {
          setError(res.message);
        }
      } else {
        setEncryptionStatus('Memverifikasi Hash Kata Sandi dengan Salt Kriptografi...');
        const res = await dbService.loginUser(email.trim(), password);
        if (res.success && res.user) {
          setEncryptionStatus('Otentikasi Berhasil! Memuat profil terenkripsi...');
          setTimeout(() => {
            onSuccess(res.user!);
            onClose();
          }, 500);
        } else {
          setError(res.message);
        }
      }
    } catch {
      setError('Terjadi kendala keamanan saat memproses data.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setLoading(true);
    setError(null);
    setEncryptionStatus('Memverifikasi kredensial demo terenkripsi...');
    const res = await dbService.loginUser(demoEmail, demoPass);
    if (res.success && res.user) {
      setTimeout(() => {
        onSuccess(res.user!);
        onClose();
      }, 400);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[bg-white] border-2 border-[#E0DED9] max-w-md w-full p-6 text-[#2C2C2C] relative my-6 font-mono-code text-xs shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#888888] hover:text-[#2C2C2C] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Security Badge */}
        <div className="flex items-center gap-1.5 mb-3 text-[10px] text-[#666666] border-2 border-[#E0DED9] bg-white/5 px-2.5 py-1 w-fit">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>PBKDF2 &amp; AES-256 ENCRYPTED</span>
        </div>

        <h3 className="text-xl font-bold uppercase tracking-tight text-[#2C2C2C]">
          {isRegister ? 'Daftar Akun HSK 1' : 'Masuk ke Platform'}
        </h3>
        <p className="text-xs text-[#666666] font-sans mt-1 mb-5">
          {isRegister
            ? 'Profil dan kata sandi Anda disimpan dengan enkripsi salted-hash yang aman di basis data.'
            : 'Masukkan email dan kata sandi terdaftar untuk melanjutkan belajar.'}
        </p>

        {error && (
          <div className="mb-4 p-3 border border-red-500/40 bg-red-950/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        {encryptionStatus && (
          <div className="mb-4 p-2.5 border-2 border-[#E0DED9] bg-white text-[#444444] text-[11px] flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5 text-amber-700 animate-spin" />
            <span>{encryptionStatus}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-[#666666] mb-1">Nama Lengkap</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border-2 border-[#E0DED9] pl-9 pr-3 py-2 text-xs text-[#2C2C2C] focus:outline-none focus:border-zinc-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[#666666] mb-1">Alamat Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border-2 border-[#E0DED9] pl-9 pr-3 py-2 text-xs text-[#2C2C2C] focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#666666] mb-1">Kata Sandi</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border-2 border-[#E0DED9] pl-9 pr-3 py-2 text-xs text-[#2C2C2C] focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-[#666666] mb-1">Peran Pengguna</label>
                <div className="grid grid-cols-2 gap-2 uppercase">
                  <button
                    type="button"
                    onClick={() => setRole('siswa')}
                    className={`py-2 px-3 border transition flex items-center justify-center gap-1.5 ${
                      role === 'siswa'
                        ? 'border-zinc-200 bg-zinc-200 text-[#2C2C2C] font-bold'
                        : 'border-[#E0DED9] bg-white text-[#666666] hover:text-[#2C2C2C]'
                    }`}
                  >
                    <span>🐼 Siswa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('guru')}
                    className={`py-2 px-3 border transition flex items-center justify-center gap-1.5 ${
                      role === 'guru'
                        ? 'border-zinc-200 bg-zinc-200 text-[#2C2C2C] font-bold'
                        : 'border-[#E0DED9] bg-white text-[#666666] hover:text-[#2C2C2C]'
                    }`}
                  >
                    <span>👨‍🏫 Guru</span>
                  </button>
                </div>
              </div>

              {role === 'siswa' && (
                <div>
                  <label className="block text-[#666666] mb-1 flex items-center gap-1">
                    <School className="w-3.5 h-3.5 text-amber-700" />
                    <span>Pilih Jenjang &amp; Kelas</span>
                  </label>

                  {!isCustomKelas ? (
                    <select
                      value={kelas}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomKelas(true);
                        } else {
                          setKelas(e.target.value);
                        }
                      }}
                      className="w-full bg-white border-2 border-[#E0DED9] px-3 py-2 text-xs text-[#2C2C2C] outline-none cursor-pointer"
                    >
                      <optgroup label="SMP">
                        <option value="Kelas 7 (RCC)" className="bg-[bg-white]">Kelas 7 (RCC)</option>
                        <option value="Kelas 7 (GCC)" className="bg-[bg-white]">Kelas 7 (GCC)</option>
                        <option value="Kelas 8" className="bg-[bg-white]">Kelas 8</option>
                        <option value="Kelas 9" className="bg-[bg-white]">Kelas 9</option>
                      </optgroup>
                      <optgroup label="SMA">
                        <option value="Kelas 10" className="bg-[bg-white]">Kelas 10</option>
                        <option value="Kelas 11" className="bg-[bg-white]">Kelas 11</option>
                        <option value="Kelas 12" className="bg-[bg-white]">Kelas 12</option>
                      </optgroup>
                      <option value="custom" className="bg-[bg-white]">+ Tulis Kelas Sendiri (Lainnya)</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: SMP 8 GCC MandarIn"
                        value={customKelas}
                        onChange={(e) => setCustomKelas(e.target.value)}
                        className="w-full bg-white border-2 border-[#E0DED9] px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomKelas(false)}
                        className="border-2 border-[#E0DED9] bg-[bg-[#F8F7F4]] text-[#444444] px-3 py-1"
                      >
                        Pilih
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#FFB703] hover:bg-[#F0A500] text-[#2C2C2C] font-bold uppercase tracking-wider transition disabled:opacity-30 mt-2"
          >
            {loading ? 'Memproses...' : isRegister ? 'Daftar Akun' : 'Masuk Sekarang'}
          </button>
        </form>

        {/* Switch Mode */}
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-[#666666] hover:text-[#2C2C2C] transition underline"
          >
            {isRegister
              ? 'Sudah punya akun? Masuk di sini'
              : 'Belum punya akun? Daftar akun baru'}
          </button>
        </div>

        {/* Quick Demo Access Buttons */}
        <div className="mt-5 pt-4 border-t border-[#E0DED9]">
          <p className="text-[10px] text-[#888888] mb-2 uppercase tracking-widest text-center">
            Akses Cepat Demo (1-Klik)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('budi@siswa.edu', 'BudiHSK2026!')}
              className="p-2 border-2 border-[#E0DED9] hover:border-zinc-500 bg-[bg-[#FFFDF9]] text-left transition"
            >
              <div className="text-xs font-bold text-[#2C2C2C] flex items-center gap-1">
                <span>🐼 Siswa (GCC)</span>
              </div>
              <div className="text-[10px] text-[#666666] mt-0.5">budi@siswa.edu</div>
            </button>
            <button
              onClick={() => handleQuickLogin('guru@hsk1.edu', 'GuruHSK2026!')}
              className="p-2 border-2 border-[#E0DED9] hover:border-zinc-500 bg-[bg-[#FFFDF9]] text-left transition"
            >
              <div className="text-xs font-bold text-[#2C2C2C] flex items-center gap-1">
                <span>👨‍🏫 Guru</span>
              </div>
              <div className="text-[10px] text-[#666666] mt-0.5">guru@hsk1.edu</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
