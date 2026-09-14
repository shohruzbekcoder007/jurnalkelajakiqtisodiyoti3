import { Download, External } from './Icons.jsx';

export const fileUrl = (filename) => `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/uploads/${filename}`;

// PDF faylni sahifa ichida o'qish uchun ko'rsatadi (+ yangi oynada ochish va yuklab olish)
export default function PdfViewer({ pdf, title, label = 'To‘liq maqola · PDF', downloadName }) {
  const url = fileUrl(pdf.filename);
  const name = downloadName || pdf.originalName || `${title}.pdf`;
  const size = pdf.size ? `${(pdf.size / 1024 / 1024).toFixed(2)} MB` : '';
  // Ko'pchilik mobil brauzerlar PDF'ni sahifa ichida ko'rsata olmaydi (pdfViewerEnabled === false)
  const canEmbed = typeof navigator === 'undefined' || navigator.pdfViewerEnabled !== false;

  const fallback = (
    <div className="pdf__fallback">
      <p>Brauzeringiz PDF faylni sahifa ichida ko‘rsata olmaydi.</p>
      <a href={url} target="_blank" rel="noreferrer" className="btn btn--primary pdf__btn">
        <External size={14} /> PDF faylni ochish
      </a>
    </div>
  );

  return (
    <section className="pdf">
      <div className="pdf__bar">
        <div className="pdf__info">
          <span className="pdf__label">{label}</span>
          <span className="pdf__name" title={name}>
            {name}
            {size && <span className="pdf__size"> · {size}</span>}
          </span>
        </div>
        <div className="pdf__actions">
          <a href={url} target="_blank" rel="noreferrer" className="btn btn--outline pdf__btn">
            <External size={14} /> Yangi oynada ochish
          </a>
          <a href={url} download={name} className="btn btn--primary pdf__btn">
            <Download size={14} /> Yuklab olish
          </a>
        </div>
      </div>

      {canEmbed ? (
        <object data={`${url}#view=FitH&navpanes=0`} type="application/pdf" className="pdf__frame" aria-label={title}>
          {fallback}
        </object>
      ) : (
        fallback
      )}
    </section>
  );
}
