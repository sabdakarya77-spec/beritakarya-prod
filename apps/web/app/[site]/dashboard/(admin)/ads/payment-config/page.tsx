'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../../../lib/api';
import { useAuthStore } from '../../../../../../store/authStore';
import { useToastStore } from '../../../../../../store/toastStore';
import {
  Settings,
  Building2,
  QrCode,
  CreditCard,
  RefreshCw,
  Plus,
  Trash2,
  Upload,
  Save,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';

interface BankAccount {
  bank: string;
  number: string;
  name: string;
}

export default function AdPaymentConfigPage() {
  const { site } = useParams() as { site: string };
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [midtransUrl, setMidtransUrl] = useState('');
  const [midtransClientKey, setMidtransClientKey] = useState('');
  const [whatsappSupport, setWhatsappSupport] = useState('');
  const [qrisImageUrl, setQrisImageUrl] = useState('');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Local helper states
  const [uploadingQris, setUploadingQris] = useState(false);

  const fetchConfig = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await api.get('/ads/payment-config', {
        params: { site },
        signal,
      });
      if (res.data?.success && res.data?.data) {
        const config = res.data.data;
        setMidtransUrl(config.midtransUrl || '');
        setMidtransClientKey(config.midtransClientKey || '');
        setWhatsappSupport(config.whatsappSupport || '');
        setQrisImageUrl(config.qrisImageUrl || '');
        
        let parsedBanks = [];
        if (config.bankAccounts) {
          parsedBanks = typeof config.bankAccounts === 'string' 
            ? JSON.parse(config.bankAccounts) 
            : config.bankAccounts;
        }
        setBankAccounts(parsedBanks);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchConfig(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site]);

  const handleAddBankAccount = () => {
    setBankAccounts(prev => [...prev, { bank: '', number: '', name: '' }]);
  };

  const handleRemoveBankAccount = (index: number) => {
    setBankAccounts(prev => prev.filter((_, i) => i !== index));
  };

  const handleBankAccountChange = (index: number, field: keyof BankAccount, value: string) => {
    setBankAccounts(prev =>
      prev.map((bank, i) => (i === index ? { ...bank, [field]: value } : bank))
    );
  };

  const handleUploadQris = async (file: File) => {
    setUploadingQris(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('siteId', site || 'pusat');
      const uploadRes = await api.post('/media/upload?purpose=qris', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = uploadRes.data?.data?.url || uploadRes.data?.url || uploadRes.data?.filePath || '';
      if (!url) throw new Error('Gagal mengunggah file');
      setQrisImageUrl(url);
      addToast('QRIS berhasil diunggah', 'success');
    } catch {
      addToast('Gagal mengunggah QRIS', 'error');
    } finally {
      setUploadingQris(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/ads/payment-config', {
        midtransUrl,
        midtransClientKey,
        whatsappSupport,
        qrisImageUrl,
        bankAccounts,
        site,
      }, {
        params: { site }
      });
      addToast('Konfigurasi pembayaran berhasil disimpan', 'success');
    } catch {
      addToast('Gagal menyimpan konfigurasi', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'superadmin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-black text-brand-black dark:text-white uppercase tracking-tight">Akses Terbatas</h2>
        <p className="text-xs text-gray-400 mt-2">Halaman ini hanya dapat diakses oleh Superadmin.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <RefreshCw size={32} className="animate-spin text-brand-red" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-lg font-black text-brand-black dark:text-white uppercase tracking-tight">Setelan Pembayaran Iklan</h1>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Konfigurasi Midtrans, rekening bank, QRIS, dan support pengiklan</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Midtrans Gateway */}
        <div className="dash-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
            <Settings size={18} className="text-brand-red" />
            <h2 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-wider">Midtrans Gateway</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Snap JS URL</label>
              <input
                type="text"
                placeholder="https://app.sandbox.midtrans.com/snap/snap.js"
                value={midtransUrl}
                onChange={(e) => setMidtransUrl(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Client Key</label>
              <input
                type="text"
                placeholder="SB-Mid-client-..."
                value={midtransClientKey}
                onChange={(e) => setMidtransClientKey(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Bank Transfer */}
        <div className="dash-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-brand-red" />
              <h2 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-wider">Rekening Bank Transfer</h2>
            </div>
            <button
              type="button"
              onClick={handleAddBankAccount}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-red text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-brand-black transition-colors"
            >
              <Plus size={12} /> Tambah
            </button>
          </div>

          {bankAccounts.length === 0 ? (
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center py-4">Belum ada rekening bank yang dikonfigurasi</p>
          ) : (
            <div className="space-y-3">
              {bankAccounts.map((account, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-3 items-end p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-200/50 dark:border-white/5 relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveBankAccount(index)}
                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="w-full md:w-1/4 space-y-1">
                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Nama Bank</label>
                    <input
                      type="text"
                      placeholder="BCA / Mandiri"
                      value={account.bank}
                      onChange={(e) => handleBankAccountChange(index, 'bank', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="w-full md:w-2/5 space-y-1">
                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Nomor Rekening</label>
                    <input
                      type="text"
                      placeholder="123-456-789"
                      value={account.number}
                      onChange={(e) => handleBankAccountChange(index, 'number', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="w-full md:w-2/5 space-y-1">
                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Atas Nama</label>
                    <input
                      type="text"
                      placeholder="PT Berita Karya"
                      value={account.name}
                      onChange={(e) => handleBankAccountChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QRIS & Support Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QRIS */}
          <div className="dash-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
              <QrCode size={18} className="text-brand-red" />
              <h2 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-wider">QRIS Merchant</h2>
            </div>
            
            <div className="space-y-4">
              {qrisImageUrl && (
                <div className="relative w-40 aspect-square mx-auto border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <img src={qrisImageUrl} alt="QRIS preview" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setQrisImageUrl('')}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/75 p-1 rounded-lg text-white transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}

              <div className="flex justify-center">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer transition-all border border-gray-200 dark:border-white/10">
                  {uploadingQris ? <RefreshCw size={12} className="animate-spin text-brand-red" /> : <Upload size={12} />}
                  {uploadingQris ? 'Mengunggah...' : 'Upload QRIS Image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingQris}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadQris(file);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Support WhatsApp */}
          <div className="dash-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-3">
              <MessageSquare size={18} className="text-brand-red" />
              <h2 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-wider">Bantuan & Kontak Support</h2>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Nomor WhatsApp (Format: 628xxx)</label>
                <input
                  type="text"
                  placeholder="628123456789"
                  value={whatsappSupport}
                  onChange={(e) => setWhatsappSupport(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs"
                />
              </div>
              <p className="text-[9px] text-gray-400 leading-relaxed">
                Nomor ini akan dipakai pada tombol &ldquo;Bantuan&rdquo; di seluruh dashboard pengiklan. Pastikan menulis tanpa menggunakan spasi, tanda hubung, atau tanda (+).
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-brand-red text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-black disabled:bg-gray-100 disabled:text-gray-400 transition-all shadow-lg shadow-brand-red/20"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Menyimpan...' : 'Simpan Setelan'}
          </button>
        </div>
      </form>
    </div>
  );
}
