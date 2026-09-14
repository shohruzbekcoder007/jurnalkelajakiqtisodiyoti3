export default function PageHeader({ eyebrow, title, children }) {
  return (
    <div className="page-head">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h1 className="display page-head__title">{title}</h1>
      {children && <div className="page-head__sub">{children}</div>}
    </div>
  );
}
