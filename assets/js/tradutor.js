// Lightweight i18n helper for browser modules
// Usage: import { t, setLocale, getLocale, onLocaleChange } from './tradutor.js'

const dictionaries = {
  pt: {
    ui: {
      title: 'WorkSwipe',
      connect: 'Conecte-se',
      accountType: 'Tipo de conta:',
      candidate: 'Candidato',
      employer: 'Empresa',
      email: 'E-mail',
      password: 'Senha',
      buttons: {
        login: 'Entrar',
        register: 'Criar Conta',
        forgot: 'Esqueci minha senha',
        google: 'Entrar com Google'
      }
    },
    app: {
      topbar: {
        modePrefix: 'Modo:',
        filters: 'Filtros',
        premium: 'Premium',
        logout: 'Sair'
      },
      mode: {
        hire: 'Contratar',
        search: 'Procurar'
      },
      matches: {
        none: 'Nenhum match ainda'
      }
    },
    common: { yes: 'Sim', no: 'Não' },
    msg: {
      fillAll: 'Preencha todos os campos.',
      passwordMin: 'A senha deve ter pelo menos 6 caracteres.',
      loggingIn: 'Entrando...',
      loginSuccess: 'Login realizado com sucesso!',
      creatingAccount: 'Criando conta...',
      accountCreated: 'Conta criada com sucesso! Você já pode fazer login.',
      emailInUse: 'Este e-mail já está cadastrado.',
      invalidEmail: 'E-mail inválido.',
      weakPassword: 'A senha é muito fraca.',
      network: 'Erro de conexão. Verifique sua internet.',
      wrongPassword: 'Senha incorreta para este e-mail. Tente novamente.',
      tooManyRequests: 'Muitas tentativas de login. Tente novamente mais tarde.',
  unauthorizedDomain: 'Domínio não autorizado. Adicione este domínio aos Domínios autorizados no Firebase.',
      errorCreatingAccount: 'Ocorreu um erro ao criar a conta.',
      emailOrPasswordWrong: 'Email ou senha incorretos',
      reset: {
        sending: 'Enviando link de redefinição...',
        sentGeneric: 'Se o e-mail existir, enviamos um link para redefinir a senha. Confira sua caixa de entrada e spam.',
        couldNotSend: 'Não foi possível enviar o e-mail de redefinição.',
        missingEmail: 'Digite seu e-mail para receber o link.',
      }
    }
  },
  en: {
    ui: {
      title: 'WorkSwipe',
      connect: 'Sign in',
      accountType: 'Account type:',
      candidate: 'Candidate',
      employer: 'Employer',
      email: 'Email',
      password: 'Password',
      buttons: {
        login: 'Log in',
        register: 'Create account',
        forgot: 'Forgot password',
        google: 'Continue with Google'
      }
    },
    app: {
      topbar: {
        modePrefix: 'Mode:',
        filters: 'Filters',
        premium: 'Premium',
        logout: 'Sign out'
      },
      mode: {
        hire: 'Hire',
        search: 'Search'
      },
      matches: {
        none: 'No matches yet'
      }
    },
    common: { yes: 'Yes', no: 'No' },
    msg: {
      fillAll: 'Please fill in all fields.',
      passwordMin: 'Password must be at least 6 characters.',
      loggingIn: 'Signing in...',
      loginSuccess: 'Logged in successfully!',
      creatingAccount: 'Creating account...',
      accountCreated: 'Account created successfully! You can log in now.',
      emailInUse: 'This email is already registered.',
      invalidEmail: 'Invalid email.',
      weakPassword: 'The password is too weak.',
      network: 'Network error. Check your internet connection.',
      wrongPassword: 'Wrong password for this email. Try again.',
      tooManyRequests: 'Too many login attempts. Try again later.',
  unauthorizedDomain: 'Unauthorized domain. Add this domain to Firebase Authorized domains.',
      errorCreatingAccount: 'An error occurred while creating the account.',
      emailOrPasswordWrong: 'Email or password is incorrect',
      reset: {
        sending: 'Sending reset link...',
        sentGeneric: 'If the email exists, we sent a link to reset your password. Check your inbox and spam.',
        couldNotSend: 'Could not send password reset email.',
        missingEmail: 'Enter your email to receive the link.',
      }
    }
  }
};

let locale = (typeof localStorage !== 'undefined' && localStorage.getItem('locale')) ||
              (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage || '').toLowerCase().startsWith('pt') ? 'pt' : 'en');
if (!dictionaries[locale]) locale = 'en';

const listeners = new Set();

export function getLocale() { return locale; }
export function setLocale(newLocale) {
  if (!dictionaries[newLocale]) return;
  locale = newLocale;
  try { localStorage.setItem('locale', locale); } catch {}
  listeners.forEach(fn => { try { fn(locale); } catch {} });
}
export function onLocaleChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

function get(obj, path) {
  return path.split('.').reduce((acc, k) => (acc && acc[k] != null ? acc[k] : undefined), obj);
}

export function t(path) {
  const d = dictionaries[locale] || dictionaries.en;
  const val = get(d, path);
  if (val != null) return val;
  const fallback = get(dictionaries.en, path);
  return fallback != null ? fallback : path;
}
