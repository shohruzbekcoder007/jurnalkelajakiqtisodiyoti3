const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const ArrowRight = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ArrowLeft = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const ChevronRight = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const Search = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export const BookOpen = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
    <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
  </svg>
);

export const Download = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2}>
    <path d="M12 3v12M7 10l5 5 5-5M4 20h16" />
  </svg>
);

export const External = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);

export const Send =({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2}>
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4z" />
  </svg>
);
