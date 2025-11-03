// Firebase config and auth helpers
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-analytics.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEWNiLU8uNtXVJJmW10_b89iCffadfHwg",
  authDomain: "sabia-1b8e4.firebaseapp.com",
  projectId: "sabia-1b8e4",
  storageBucket: "sabia-1b8e4.firebasestorage.app",
  messagingSenderId: "4263516305",
  appId: "1:4263516305:web:5a9837a326560337288730",
  measurementId: "G-0PCBD6N8NG"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth helpers
export async function registerUser(email, password, type) {
  try {
    console.log('Iniciando registro...', { email, type });
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('Usuário criado no Auth, salvando no Firestore...', user.uid);
    
    // Create initial user document in Firestore
    const userData = {
      email,
      type,
      matches: [],
      stats: { views: 0, likes: 0 },
      premium: false,
      mode: type || 'candidate',
      createdAt: new Date().toISOString()
    };
    
    // Use set com merge para garantir que dados existentes não sejam sobrescritos
    await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
    console.log('Dados salvos no Firestore com sucesso');
    
    return {
      userCredential,
      userData
    };
  } catch (error) {
    console.error("Erro ao registrar:", error);
    // Preserve o erro original do Firebase (que contém 'code')
    // e apenas acrescente uma mensagem amigável para a UI.
    if (error && error.code === 'auth/email-already-in-use') {
      error.friendlyMessage = 'Este e-mail já está cadastrado.';
    }
    throw error;
  }
}

export async function loginUser(email, password) {
  try {
    console.log('Tentando login...', { email });
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Busca os dados adicionais do usuário no Firestore
    console.log('Login bem sucedido, buscando dados do Firestore...');
    const userData = await getUserData(userCredential.user.uid);
    
    if (!userData) {
      console.log('Dados não encontrados, criando perfil inicial...');
      // Se não existir dados no Firestore, cria um perfil inicial
      const initialData = {
        email: userCredential.user.email,
        type: 'candidate', // valor padrão
        matches: [],
        stats: { views: 0, likes: 0 },
        premium: false,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), initialData, { merge: true });
      return { userCredential, userData: initialData };
    }
    
    console.log('Dados recuperados com sucesso', userData);
    return { userCredential, userData };
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Email ou senha incorretos');
    }
    throw error;
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    throw error;
  }
}

// Password reset
export async function resetPassword(email) {
  try {
    if (!email) {
      const err = new Error('Informe um e-mail para redefinir a senha.');
      err.code = 'auth/missing-email';
      throw err;
    }
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('Erro ao enviar e-mail de redefinição:', error);
    throw error;
  }
}

// Google login
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    let userCredential;
    try {
      userCredential = await signInWithPopup(auth, provider);
    } catch (err) {
      // Fallback quando o popup for bloqueado
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, provider);
        // signInWithRedirect redireciona a página; em ambientes sem navegação isso pode não funcionar
        // então retornamos aqui para evitar executar código adicional.
        return { userCredential: null, userData: null, redirected: true };
      }
      throw err;
    }

    // Busca ou cria perfil no Firestore
    const uid = userCredential.user.uid;
    let userData = await getUserData(uid);
    if (!userData) {
      const initialData = {
        email: userCredential.user.email,
        name: userCredential.user.displayName || '',
        photoURL: userCredential.user.photoURL || '',
        type: 'candidate',
        matches: [],
        stats: { views: 0, likes: 0 },
        premium: false,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', uid), initialData, { merge: true });
      userData = initialData;
    }

    return { userCredential, userData };
  } catch (error) {
    console.error('Erro no login com Google:', error);
    throw error;
  }
}

// Firestore helpers
export async function getUserData(uid) {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error);
    throw error;
  }
}

export async function updateUserData(uid, data) {
  try {
    await setDoc(doc(db, 'users', uid), data, { merge: true });
  } catch (error) {
    console.error("Erro ao atualizar dados:", error);
    throw error;
  }
}

export async function fetchProfiles() {
  try {
    const querySnapshot = await getDocs(collection(db, 'profiles'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Erro ao buscar perfis:", error);
    throw error;
  }
}

export { auth };