import { useSyncExternalStore } from 'react';

// Kun/tun rejimi. Tanlov localStorage'da; tanlanmagan bo'lsa qurilma (OS) sozlamasi olinadi.
// Birinchi chizishdan oldin index.html dagi skript data-theme ni qo'yadi (kalit bir xil bo'lishi kerak)
const KEY = 'ki-theme';
const listeners = new Set();

const saved = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

const current = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

function apply(theme) {
  document.documentElement.dataset.theme = theme;
  listeners.forEach((l) => l());
}

// Foydalanuvchi o'zi tanlamagan bo'lsa, OS sozlamasi o'zgarishiga ergashadi
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!saved()) apply(e.matches ? 'dark' : 'light');
});

// Boshqa ochiq varaqlarda ham bir vaqtda almashadi
window.addEventListener('storage', (e) => {
  if (e.key === KEY && (e.newValue === 'dark' || e.newValue === 'light')) apply(e.newValue);
});

export function toggleTheme() {
  const next = current() === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* private rejim — faqat shu sahifa uchun */
  }
  apply(next);
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useTheme = () => useSyncExternalStore(subscribe, current);
