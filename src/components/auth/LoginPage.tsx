import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Package2, ShieldCheck, Lock, User as UserIcon, 
  Key, AlertCircle, RefreshCw, ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username dan kata sandi wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(username.trim(), password.trim());
      if (!res.success) {
        setError(res.message || 'Username atau kata sandi salah / akun dinonaktifkan.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem saat mencoba masuk.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
    setIsLoading(true);
    try {
      const res = await login(u, p);
      if (!res.success) {
        setError(res.message || 'Kredensial demo tidak valid.');
      }
    } catch (err: any) {
      setError(err.message || 'Gangguan koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden overflow-x-hidden w-full max-w-full font-sans">
      {/* Background Ambient Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:36px_36px] opacity-40 pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw] h-[350px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Brand Header */}
      <div className="relative pt-6 sm:pt-10 text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-foreground text-background items-center justify-center shadow-lg mb-3">
          <Package2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight font-display">
          Sistem<span className="text-muted-foreground">Gudang</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          Sistem Distribusi Gudang Pusat & Manajemen Toko Cabang
        </p>
      </div>

      {/* Main Login Card */}
      <div className="relative w-full max-w-md mx-auto my-auto space-y-4 py-4 z-10">
        <Card className="backdrop-blur-xl bg-card/90 shadow-xl border-border">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-bold text-card-foreground tracking-tight">
              Masuk ke Portal Operasional
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Masukkan akun terdaftar untuk mengakses modul gudang atau toko
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            <form onSubmit={handleManualLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Username Pengguna
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    placeholder="Contoh: admin.gudang atau staf.toko1"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="pl-10 text-xs h-10"
                  />
                  <UserIcon className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    required
                    placeholder="Masukkan kata sandi..."
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 text-xs h-10"
                  />
                  <Key className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-xs font-bold gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Sesi...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Masuk Sekarang</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Access Helper for Testing / Demo */}
        <Card className="bg-muted/40 border-border/80">
          <CardContent className="p-4 sm:p-5 text-xs text-muted-foreground space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                Akses Cepat Pengujian:
              </span>
              <Badge variant="outline" className="text-[10px]">Pilih Demo</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickFill('admin.gudang', 'admin123')}
                disabled={isLoading}
                className="justify-between h-auto py-2.5 px-3 text-left text-xs bg-card/60 hover:bg-card"
              >
                <div>
                  <span className="text-[10px] font-bold text-primary block">
                    Admin Pusat
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">admin.gudang</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickFill('staf.toko1', 'toko123')}
                disabled={isLoading}
                className="justify-between h-auto py-2.5 px-3 text-left text-xs bg-card/60 hover:bg-card"
              >
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                    Staf Toko 1
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">staf.toko1</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="relative pb-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5 z-10">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Multi-Tenant RBAC & PostgreSQL Protected</span>
      </div>
    </div>
  );
};
