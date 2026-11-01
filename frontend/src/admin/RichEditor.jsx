import { useEffect, useRef, useState } from 'react';
import { useEditor, useEditorState, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TiptapImage from '@tiptap/extension-image';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import Youtube from '@tiptap/extension-youtube';
import { Placeholder, CharacterCount } from '@tiptap/extensions';
import {
  Undo2, Redo2, Bold, Italic, Underline, Strikethrough, Subscript as SubIcon, Superscript as SupIcon,
  Baseline, Highlighter, TextAlignStart, TextAlignCenter, TextAlignEnd, TextAlignJustify,
  List, ListOrdered, TextQuote, SeparatorHorizontal, Link, Unlink, ImagePlus, Paperclip, SquarePlay,
  Table as TableIcon, TableCellsMerge, TableCellsSplit, BetweenHorizontalStart, BetweenHorizontalEnd,
  BetweenVerticalStart, BetweenVerticalEnd, PanelTop, Rows2, Columns2, Trash, RemoveFormatting,
  CodeXml, Maximize2, Minimize2, ChevronDown, Ban,
} from 'lucide-react';
import { adminApi, uploadUrl } from './adminApi.js';

// Sayt ranglari + bir nechta odatiy ranglar
const TEXT_COLORS = ['#173744', '#31718d', '#c66d5d', '#2f434e', '#7b8e94', '#000000', '#b03a2e', '#ca6f1e', '#b7950b', '#1e8449', '#1f618d', '#7d3c98'];
const HIGHLIGHTS = ['#fff3a3', '#ffe0b8', '#ffd1d1', '#d6f2d6', '#d4e9fb', '#e9defc', '#dceaea', '#eeeeee'];

const BLOCKS = [
  { value: 'p', label: 'Oddiy matn' },
  { value: '2', label: 'Sarlavha 1' },
  { value: '3', label: 'Sarlavha 2' },
  { value: '4', label: 'Sarlavha 3' },
];

const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] },
    code: false,
    codeBlock: false,
    // "Yangi oynada ochish" havola formasida tanlanadi
    link: { openOnClick: false, defaultProtocol: 'https', HTMLAttributes: { target: null, rel: null } },
  }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  Subscript,
  Superscript,
  TiptapImage.configure({ resize: { enabled: true, alwaysPreserveAspectRatio: true, minWidth: 60 } }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
  Youtube.configure({ nocookie: true, width: 640, height: 360 }),
  Placeholder.configure({ placeholder: 'Sahifa matnini shu yerga yozing…' }),
  CharacterCount,
];

const isImageFile = (file) => /^image\/(jpeg|png|gif|webp)$/.test(file.type);

export default function RichEditor({ value, onChange }) {
  const [status, setStatus] = useState({ type: '', text: '' });
  const [source, setSource] = useState(null); // HTML rejimida matn, aks holda null
  const [full, setFull] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Fayllarni yuklab, muharrirga qo'shadi (tugma, sudrab tashlash, nusxalash)
  const uploadRef = useRef(null);
  uploadRef.current = async (files, insert) => {
    for (const file of files) {
      setStatus({ type: 'busy', text: `Yuklanmoqda: ${file.name}` });
      try {
        const res = await adminApi.uploadFile(file);
        insert({ ...res, url: uploadUrl(res.path) });
        setStatus({ type: '', text: '' });
      } catch (err) {
        setStatus({ type: 'error', text: `${file.name}: ${err.message}` });
        return;
      }
    }
  };

  const editor = useEditor({
    extensions,
    content: value,
    editorProps: {
      attributes: { class: 'prose rte__content' },
      handlePaste: (view, event) => {
        const files = [...(event.clipboardData?.files || [])].filter(isImageFile);
        if (!files.length) return false;
        uploadRef.current(files, (res) => {
          const node = view.state.schema.nodes.image.create({ src: res.url, alt: res.name });
          view.dispatch(view.state.tr.replaceSelectionWith(node));
        });
        return true;
      },
      handleDrop: (view, event, slice, moved) => {
        const files = [...(event.dataTransfer?.files || [])].filter(isImageFile);
        if (moved || !files.length) return false;
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? view.state.selection.from;
        uploadRef.current(files, (res) => {
          const node = view.state.schema.nodes.image.create({ src: res.url, alt: res.name });
          view.dispatch(view.state.tr.insert(Math.min(pos, view.state.doc.content.size), node));
        });
        return true;
      },
    },
    onUpdate: ({ editor: e }) => onChangeRef.current(e.isEmpty ? '' : e.getHTML()),
  });

  // Tashqaridan kelgan qiymat (sahifa yuklanganda yoki HTML rejimida) muharrirga o'tadi
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? '' : editor.getHTML();
    if (value !== current) editor.commands.setContent(value || '', { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    if (!full) return undefined;
    const onKey = (e) => e.key === 'Escape' && setFull(false);
    document.addEventListener('keydown', onKey);
    document.body.classList.add('rte-lock');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('rte-lock');
    };
  }, [full]);

  const state = useEditorState({
    editor,
    // Snapshot'dagi emas, joriy nusxadan o'qiladi: useEditor nusxani almashtirganda (StrictMode,
    // sekin birinchi render) snapshot yangi tranzaksiyagacha yo'q qilingan eski editor'da qolib ketadi
    selector: () => {
      const e = editor;
      if (!e || e.isDestroyed) return null;
      const count = e.storage.characterCount;
      const heading = [2, 3, 4].find((level) => e.isActive('heading', { level }));
      return {
        block: heading ? String(heading) : 'p',
        bold: e.isActive('bold'),
        italic: e.isActive('italic'),
        underline: e.isActive('underline'),
        strike: e.isActive('strike'),
        sub: e.isActive('subscript'),
        sup: e.isActive('superscript'),
        color: e.getAttributes('textStyle').color || '',
        highlight: e.isActive('highlight') ? e.getAttributes('highlight').color || '#fff3a3' : '',
        align: ['center', 'right', 'justify'].find((a) => e.isActive({ textAlign: a })) || 'left',
        bulletList: e.isActive('bulletList'),
        orderedList: e.isActive('orderedList'),
        blockquote: e.isActive('blockquote'),
        link: e.isActive('link'),
        linkAttrs: e.getAttributes('link'),
        table: e.isActive('table'),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
        canMerge: e.can().mergeCells(),
        canSplit: e.can().splitCell(),
        words: count ? count.words() : 0,
        chars: count ? count.characters() : 0,
      };
    },
  });

  if (!editor || !state) return null;

  const run = (fn) => () => fn(editor.chain().focus()).run();
  // "Chapga" — standart holat, shuning uchun ortiqcha text-align yozilmaydi
  const alignLeft = (c) => c.unsetTextAlign();

  const pickFile = (accept, onFiles) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = true;
    input.onchange = () => onFiles([...input.files]);
    input.click();
  };

  const insertImages = () =>
    pickFile('image/jpeg,image/png,image/gif,image/webp', (files) =>
      uploadRef.current(files, (res) => editor.chain().focus().setImage({ src: res.url, alt: res.name }).run())
    );

  // Belgilangan matn bo'lsa unga havola qo'yiladi, bo'lmasa fayl nomi havola sifatida qo'shiladi
  const insertFiles = () =>
    pickFile('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.zip,image/*', (files) =>
      uploadRef.current(files, (res) => {
        const chain = editor.chain().focus();
        if (!editor.state.selection.empty) {
          chain.extendMarkRange('link').setLink({ href: res.url, target: '_blank' }).run();
        } else {
          chain
            .insertContent([
              { type: 'text', text: res.name, marks: [{ type: 'link', attrs: { href: res.url, target: '_blank' } }] },
              { type: 'text', text: ' ' },
            ])
            .run();
        }
      })
    );

  const toggleSource = () => {
    if (source === null) {
      setSource(editor.isEmpty ? '' : editor.getHTML());
    } else {
      onChange(editor.isEmpty ? '' : editor.getHTML());
      setSource(null);
    }
  };

  const off = source !== null;

  return (
    <div className={`rte${full ? ' rte--full' : ''}`}>
      <div className="rte__toolbar" role="toolbar" aria-label="Matn formatlash">
        <Group>
          <Btn title="Bekor qilish (Ctrl+Z)" icon={Undo2} disabled={off || !state.canUndo} onClick={run((c) => c.undo())} />
          <Btn title="Qaytarish (Ctrl+Y)" icon={Redo2} disabled={off || !state.canRedo} onClick={run((c) => c.redo())} />
        </Group>
        <Group>
          <select
            className="rte__select"
            title="Matn turi"
            value={state.block}
            disabled={off}
            onChange={(e) => {
              const v = e.target.value;
              const chain = editor.chain().focus();
              (v === 'p' ? chain.setParagraph() : chain.setHeading({ level: Number(v) })).run();
            }}
          >
            {BLOCKS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </Group>
        <Group>
          <Btn title="Qalin (Ctrl+B)" icon={Bold} active={state.bold} disabled={off} onClick={run((c) => c.toggleBold())} />
          <Btn title="Kursiv (Ctrl+I)" icon={Italic} active={state.italic} disabled={off} onClick={run((c) => c.toggleItalic())} />
          <Btn title="Tagiga chizilgan (Ctrl+U)" icon={Underline} active={state.underline} disabled={off} onClick={run((c) => c.toggleUnderline())} />
          <Btn title="Ustidan chizilgan" icon={Strikethrough} active={state.strike} disabled={off} onClick={run((c) => c.toggleStrike())} />
          <Btn title="Pastki indeks" icon={SubIcon} active={state.sub} disabled={off} onClick={run((c) => c.toggleSubscript())} />
          <Btn title="Yuqori indeks" icon={SupIcon} active={state.sup} disabled={off} onClick={run((c) => c.toggleSuperscript())} />
        </Group>
        <Group>
          <ColorMenu
            title="Matn rangi"
            icon={Baseline}
            current={state.color}
            colors={TEXT_COLORS}
            disabled={off}
            onPick={(c) => editor.chain().setColor(c).run()}
            onClear={() => editor.chain().unsetColor().run()}
          />
          <ColorMenu
            title="Fon rangi (marker)"
            icon={Highlighter}
            current={state.highlight}
            colors={HIGHLIGHTS}
            disabled={off}
            onPick={(c) => editor.chain().setHighlight({ color: c }).run()}
            onClear={() => editor.chain().unsetHighlight().run()}
          />
        </Group>
        <Group>
          <Btn title="Chapga" icon={TextAlignStart} active={state.align === 'left'} disabled={off} onClick={run(alignLeft)} />
          <Btn title="Markazga" icon={TextAlignCenter} active={state.align === 'center'} disabled={off} onClick={run((c) => c.setTextAlign('center'))} />
          <Btn title="O‘ngga" icon={TextAlignEnd} active={state.align === 'right'} disabled={off} onClick={run((c) => c.setTextAlign('right'))} />
          <Btn title="Ikki tomonga" icon={TextAlignJustify} active={state.align === 'justify'} disabled={off} onClick={run((c) => c.setTextAlign('justify'))} />
        </Group>
        <Group>
          <Btn title="Belgili ro‘yxat" icon={List} active={state.bulletList} disabled={off} onClick={run((c) => c.toggleBulletList())} />
          <Btn title="Raqamli ro‘yxat" icon={ListOrdered} active={state.orderedList} disabled={off} onClick={run((c) => c.toggleOrderedList())} />
          <Btn title="Iqtibos" icon={TextQuote} active={state.blockquote} disabled={off} onClick={run((c) => c.toggleBlockquote())} />
          <Btn title="Ajratuvchi chiziq" icon={SeparatorHorizontal} disabled={off} onClick={run((c) => c.setHorizontalRule())} />
        </Group>
        <Group>
          <LinkMenu editor={editor} active={state.link} attrs={state.linkAttrs} disabled={off} />
          <Btn title="Havolani olib tashlash" icon={Unlink} disabled={off || !state.link} onClick={run((c) => c.extendMarkRange('link').unsetLink())} />
        </Group>
        <Group>
          <Btn title="Rasm qo‘shish" icon={ImagePlus} disabled={off} onClick={insertImages} />
          <Btn title="Fayl biriktirish (PDF, Word, Excel…)" icon={Paperclip} disabled={off} onClick={insertFiles} />
          <VideoMenu editor={editor} disabled={off} onError={(text) => setStatus({ type: 'error', text })} />
          <TableMenu editor={editor} disabled={off} />
        </Group>
        <Group>
          <Btn title="Formatlashni tozalash" icon={RemoveFormatting} disabled={off} onClick={run((c) => c.unsetAllMarks().clearNodes())} />
          <Btn title="HTML kod" icon={CodeXml} active={off} onClick={toggleSource} />
          <Btn title={full ? 'Oddiy ko‘rinish (Esc)' : 'To‘liq ekran'} icon={full ? Minimize2 : Maximize2} active={full} onClick={() => setFull((f) => !f)} />
        </Group>
      </div>

      {state.table && !off && (
        <div className="rte__toolbar rte__toolbar--sub" role="toolbar" aria-label="Jadval">
          <span className="rte__sub-label">Jadval:</span>
          <Btn title="Yuqoriga qator qo‘shish" icon={BetweenHorizontalStart} onClick={run((c) => c.addRowBefore())} />
          <Btn title="Pastga qator qo‘shish" icon={BetweenHorizontalEnd} onClick={run((c) => c.addRowAfter())} />
          <Btn title="Chapga ustun qo‘shish" icon={BetweenVerticalStart} onClick={run((c) => c.addColumnBefore())} />
          <Btn title="O‘ngga ustun qo‘shish" icon={BetweenVerticalEnd} onClick={run((c) => c.addColumnAfter())} />
          <span className="rte__sep" />
          <Btn title="Qatorni o‘chirish" icon={Rows2} label="Qator" danger onClick={run((c) => c.deleteRow())} />
          <Btn title="Ustunni o‘chirish" icon={Columns2} label="Ustun" danger onClick={run((c) => c.deleteColumn())} />
          <span className="rte__sep" />
          <Btn title="Kataklarni birlashtirish" icon={TableCellsMerge} disabled={!state.canMerge} onClick={run((c) => c.mergeCells())} />
          <Btn title="Katakni ajratish" icon={TableCellsSplit} disabled={!state.canSplit} onClick={run((c) => c.splitCell())} />
          <Btn title="Sarlavha qatori" icon={PanelTop} onClick={run((c) => c.toggleHeaderRow())} />
          <span className="rte__sep" />
          <Btn title="Jadvalni o‘chirish" icon={Trash} label="Jadval" danger onClick={run((c) => c.deleteTable())} />
        </div>
      )}

      {off && (
        <textarea
          className="rte__source"
          value={source}
          spellCheck={false}
          onChange={(e) => {
            setSource(e.target.value);
            onChange(e.target.value);
          }}
        />
      )}
      {/* HTML rejimida ham muharrir DOM'da qoladi — faqat yashiriladi */}
      <EditorContent editor={editor} className="rte__body" hidden={off} />

      <div className="rte__status">
        <span className={status.type ? `rte__msg rte__msg--${status.type}` : 'rte__msg'}>
          {status.text || (off ? 'Bu yerda faqat muharrir qo‘llaydigan teglar saqlanadi. <style>, <script> va o‘z dizayningiz uchun yuqoridagi “HTML / CSS / JS kod” rejimini tanlang' : 'Rasmni sudrab tashlash yoki nusxalab qo‘yish ham mumkin')}
        </span>
        <span>
          {state.words} so‘z · {state.chars} belgi
        </span>
      </div>
    </div>
  );
}

function Group({ children }) {
  return <div className="rte__group">{children}</div>;
}

function Btn({ title, icon: Icon, label, active, disabled, danger, onClick }) {
  return (
    <button
      type="button"
      className={`rte__btn${active ? ' is-active' : ''}${danger ? ' rte__btn--danger' : ''}${label ? ' rte__btn--label' : ''}`}
      title={title}
      aria-label={title}
      aria-pressed={active === undefined ? undefined : active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <Icon size={16} strokeWidth={2} />
      {label && <span>{label}</span>}
    </button>
  );
}

// Tugma + ochiladigan panel; tashqariga bosilganda yoki Esc bilan yopiladi
function Popover({ title, icon: Icon, active, disabled, swatch, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  return (
    <div className="rte__pop" ref={ref}>
      <button
        type="button"
        className={`rte__btn rte__btn--menu${active || open ? ' is-active' : ''}`}
        title={title}
        aria-label={title}
        aria-expanded={open}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon size={16} strokeWidth={2} />
        {swatch !== undefined && <span className="rte__swatch-bar" style={{ background: swatch || 'transparent' }} />}
        <ChevronDown size={11} strokeWidth={2.4} />
      </button>
      {open && <div className="rte__panel">{children(() => setOpen(false))}</div>}
    </div>
  );
}

function ColorMenu({ title, icon, current, colors, disabled, onPick, onClear }) {
  return (
    <Popover title={title} icon={icon} disabled={disabled} swatch={current}>
      {(close) => (
        <>
          <div className="rte__swatches">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                className={`rte__swatch${current.toLowerCase() === c ? ' is-active' : ''}`}
                style={{ background: c }}
                title={c}
                aria-label={c}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(c);
                  close();
                }}
              />
            ))}
          </div>
          <div className="rte__panel-row">
            <label className="rte__custom" title="Boshqa rang">
              Boshqa:
              <input type="color" defaultValue={current || '#173744'} onChange={(e) => onPick(e.target.value)} />
            </label>
            <button
              type="button"
              className="rte__text-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onClear();
                close();
              }}
            >
              <Ban size={13} /> Olib tashlash
            </button>
          </div>
        </>
      )}
    </Popover>
  );
}

// Form ichida bo'lgani uchun Enter sahifa formasini yubormasligi kerak
const onEnter = (fn) => (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    fn();
  }
};

function LinkMenu({ editor, active, attrs, disabled }) {
  return (
    <Popover title="Havola qo‘yish" icon={Link} active={active} disabled={disabled}>
      {(close) => <LinkForm editor={editor} attrs={attrs} close={close} />}
    </Popover>
  );
}

function LinkForm({ editor, attrs, close }) {
  const [href, setHref] = useState(attrs.href || '');
  const [blank, setBlank] = useState(attrs.target === '_blank');
  const [text, setText] = useState('');
  const hasSelection = !editor.state.selection.empty || !!attrs.href;

  const apply = () => {
    const url = href.trim();
    const chain = editor.chain().focus();
    if (!url) {
      chain.extendMarkRange('link').unsetLink().run();
    } else if (hasSelection) {
      chain.extendMarkRange('link').setLink({ href: url, target: blank ? '_blank' : null }).run();
    } else {
      chain
        .insertContent({ type: 'text', text: text.trim() || url, marks: [{ type: 'link', attrs: { href: url, target: blank ? '_blank' : null } }] })
        .run();
    }
    close();
  };

  return (
    <div className="rte__form">
      <label className="rte__form-label">
        Manzil (URL)
        <input className="input" autoFocus value={href} placeholder="https://…" onChange={(e) => setHref(e.target.value)} onKeyDown={onEnter(apply)} />
      </label>
      {!hasSelection && (
        <label className="rte__form-label">
          Ko‘rinadigan matn
          <input className="input" value={text} placeholder="Bo‘sh bo‘lsa manzil ko‘rinadi" onChange={(e) => setText(e.target.value)} onKeyDown={onEnter(apply)} />
        </label>
      )}
      <label className="rte__check">
        <input type="checkbox" checked={blank} onChange={(e) => setBlank(e.target.checked)} /> Yangi oynada ochilsin
      </label>
      <div className="rte__panel-row">
        <button type="button" className="adm-btn adm-btn--primary" onClick={apply}>
          Saqlash
        </button>
        {attrs.href && (
          <button
            type="button"
            className="rte__text-btn"
            onClick={() => {
              editor.chain().focus().extendMarkRange('link').unsetLink().run();
              close();
            }}
          >
            <Unlink size={13} /> Olib tashlash
          </button>
        )}
      </div>
    </div>
  );
}

function VideoMenu({ editor, disabled, onError }) {
  return (
    <Popover title="YouTube video" icon={SquarePlay} disabled={disabled}>
      {(close) => <VideoForm editor={editor} close={close} onError={onError} />}
    </Popover>
  );
}

function VideoForm({ editor, close, onError }) {
  const [url, setUrl] = useState('');
  const apply = () => {
    if (!editor.chain().focus().setYoutubeVideo({ src: url.trim() }).run()) {
      onError('YouTube havolasi noto‘g‘ri');
      return;
    }
    close();
  };
  return (
    <div className="rte__form">
      <label className="rte__form-label">
        YouTube havolasi
        <input className="input" autoFocus value={url} placeholder="https://www.youtube.com/watch?v=…" onChange={(e) => setUrl(e.target.value)} onKeyDown={onEnter(apply)} />
      </label>
      <div className="rte__panel-row">
        <button type="button" className="adm-btn adm-btn--primary" onClick={apply}>
          Qo‘shish
        </button>
      </div>
    </div>
  );
}

function TableMenu({ editor, disabled }) {
  return (
    <Popover title="Jadval qo‘shish" icon={TableIcon} disabled={disabled}>
      {(close) => <TableForm editor={editor} close={close} />}
    </Popover>
  );
}

// Word'dagidek katakchalarni belgilab o'lcham tanlash
function TableForm({ editor, close }) {
  const [size, setSize] = useState({ rows: 0, cols: 0 });
  const MAX = 8;
  return (
    <div className="rte__form">
      <div className="rte__grid" onMouseLeave={() => setSize({ rows: 0, cols: 0 })}>
        {Array.from({ length: MAX * MAX }, (_, i) => {
          const r = Math.floor(i / MAX) + 1;
          const c = (i % MAX) + 1;
          return (
            <button
              key={i}
              type="button"
              aria-label={`${r} × ${c}`}
              className={`rte__cell${r <= size.rows && c <= size.cols ? ' is-on' : ''}`}
              onMouseEnter={() => setSize({ rows: r, cols: c })}
              onFocus={() => setSize({ rows: r, cols: c })}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run();
                close();
              }}
            />
          );
        })}
      </div>
      <div className="rte__grid-label">{size.rows ? `${size.rows} qator × ${size.cols} ustun` : 'O‘lchamni tanlang'}</div>
    </div>
  );
}
