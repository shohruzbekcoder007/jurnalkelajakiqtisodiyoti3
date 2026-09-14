import { useEffect, useState } from 'react';

export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error) => active && setState({ data: null, loading: false, error }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

// Asl saytdagi ko'rinish: "2026 M08 24"
export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()} M${mm} ${d.getDate()}`;
}
