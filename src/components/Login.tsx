import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { Loader2, Lock, Mail, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      onLoginSuccess();
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      // Translate common Firebase errors for a premium UX
      switch (err.code) {
        case 'auth/invalid-email':
          setErrorMsg('O endereço de e-mail inserido é inválido.');
          break;
        case 'auth/user-disabled':
          setErrorMsg('Esta conta de usuário foi desativada.');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setErrorMsg('E-mail ou senha incorretos. Verifique suas credenciais.');
          break;
        case 'auth/network-request-failed':
          setErrorMsg('Erro de conexão. Verifique se está conectado à internet para fazer login.');
          break;
        default:
          setErrorMsg('Falha ao tentar fazer login. Tente novamente mais tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)',
      padding: '24px'
    }}>
      <div className="card fade-in" style={{
        maxWidth: '400px',
        width: '100%',
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: '0 12px 40px rgba(24, 24, 23, 0.04)'
      }}>
        {/* Logo App */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--text-primary)',
          color: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          fontSize: '1.8rem',
          fontFamily: 'var(--font-serif)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
        }}>
          V
        </div>

        {/* Branding header */}
        <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', fontWeight: 400, marginBottom: '8px' }}>
          VistoriaPro
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Área Restrita — Digite suas credenciais para acessar o painel de perícias
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
          {/* Email input field */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={12} /> E-mail de Acesso
            </label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              style={{ fontSize: '0.95rem' }}
            />
          </div>

          {/* Password input field */}
          <div className="form-group" style={{ marginBottom: 0, position: 'relative' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={12} /> Senha
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-control" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                style={{ paddingRight: '36px', fontSize: '0.95rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0',
                  bottom: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '12px',
              backgroundColor: 'var(--accent-rust-light)',
              color: 'var(--accent-rust)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginTop: '8px'
            }}>
              <Lock size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isLoading}
            style={{ width: '100%', padding: '14px', marginTop: '12px' }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spin" />
                Autenticando...
              </>
            ) : (
              'Entrar no Sistema'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
