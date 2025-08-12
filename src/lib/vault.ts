// Simple on-device vault using IndexedDB + WebCrypto AES-GCM
// - Stores a non-extractable master key in IndexedDB
// - Encrypts/decrypts small strings (API keys) per label (e.g., provider)

type CipherBlob = { iv: ArrayBuffer; data: ArrayBuffer };

const DB_NAME = 'cc_vault';
const DB_VERSION = 1;
const STORE_KEYS = 'keys';
const STORE_SECRETS = 'secrets';
const MASTER_KEY_ID = 'master:aes-gcm-256';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_KEYS)) db.createObjectStore(STORE_KEYS);
      if (!db.objectStoreNames.contains(STORE_SECRETS)) db.createObjectStore(STORE_SECRETS);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getFromStore<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const st = tx.objectStore(store);
    const req = st.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function putInStore(store: string, key: IDBValidKey, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const st = tx.objectStore(store);
    const req = st.put(value as any, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function deleteFromStore(store: string, key: IDBValidKey): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const st = tx.objectStore(store);
    const req = st.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function ensureMasterKey(): Promise<CryptoKey> {
  let key = await getFromStore<CryptoKey>(STORE_KEYS, MASTER_KEY_ID);
  if (key) return key;
  key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await putInStore(STORE_KEYS, MASTER_KEY_ID, key);
  return key;
}

export async function saveSecret(label: string, plaintext: string): Promise<void> {
  const key = await ensureMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  const blob: CipherBlob = { iv: iv.buffer, data };
  await putInStore(STORE_SECRETS, label, blob);
}

export async function loadSecret(label: string): Promise<string | null> {
  const blob = await getFromStore<CipherBlob>(STORE_SECRETS, label);
  if (!blob) return null;
  const key = await ensureMasterKey();
  try {
    const dec = new TextDecoder();
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: blob.iv }, key, blob.data);
    return dec.decode(pt);
  } catch {
    return null;
  }
}

export async function clearSecret(label: string): Promise<void> {
  await deleteFromStore(STORE_SECRETS, label);
}


