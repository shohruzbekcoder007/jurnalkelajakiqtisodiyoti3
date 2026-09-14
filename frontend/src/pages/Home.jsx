import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useFetch } from '../utils/useFetch.js';
import ArticleMeta from '../components/ArticleMeta.jsx';
import SideLabel from '../components/SideLabel.jsx';
import InfoBox from '../components/InfoBox.jsx';
import { ArrowRight, BookOpen, ChevronRight } from '../components/Icons.jsx';

export default function Home() {
  const issue = useFetch(() => api.currentIssue());
  const latest = useFetch(() => api.articles({ limit: 6 }));
  const rubrics = useFetch(() => api.rubrics());

  const articles = latest.data?.items || [];
  const [main, ...rest] = articles.slice(0, 3);

  return (
    <div className="container">
      <section className="hero">
        <div className="hero__text">
          <div className="eyebrow">Ilmiy elektron jurnal · 2024</div>
          <h1 className="display hero__title">“Moliyaviy texnologiyalar” ilmiy elektron jurnali</h1>
          <p className="hero__sub">Toshkent davlat iqtisodiyot universiteti</p>
          <div className="hero__actions">
            <Link to="/arxiv" className="btn btn--primary">
              Arxivni ko‘rish <ArrowRight />
            </Link>
            <Link to="/maqola-yuborish" className="btn btn--outline">
              Maqola yuborish
            </Link>
          </div>
        </div>

        <div className="issue-card">
          <span className="issue-card__mark" aria-hidden>FT</span>
          <div className="issue-card__top">
            <span>So‘nggi son</span>
            <span>№ {issue.data?.title || '—'}</span>
          </div>
          <div className="issue-card__title">{issue.data?.title || '—'}</div>
          <div className="issue-card__foot">
            <span className="issue-card__line" />
            <BookOpen size={14} />
            <span>{issue.data?.articleCount ?? 0} ta ilmiy maqola</span>
          </div>
        </div>
      </section>

      <div className="home-grid">
        <div>
          <section className="section">
            <div className="section-head">
              <h2 className="section-head__title">Tanlangan maqolalar</h2>
              <span className="section-head__note">Tadqiqotlar va tahlillar</span>
            </div>

            {main && (
              <div className="featured">
                <Link to={`/maqola/${main.slug}`} className="featured__main">
                  <ArticleMeta article={main} />
                  <h3 className="article-title featured__main-title">{main.title}</h3>
                  <p className="featured__summary">{main.summary}</p>
                  <span className="link-arrow link-arrow--light">
                    Maqolani o‘qish <ArrowRight size={13} />
                  </span>
                </Link>
                <div className="featured__side">
                  {rest.map((a) => (
                    <Link key={a._id} to={`/maqola/${a.slug}`} className="featured__card">
                      <ArticleMeta article={a} />
                      <h3 className="article-title featured__card-title">{a.title}</h3>
                      <span className="link-arrow">
                        Maqolani o‘qish <ArrowRight size={13} />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="section section--latest">
            <div className="section-head">
              <h2 className="section-head__title">So‘nggi maqolalar</h2>
              <Link to="/arxiv" className="section-head__link">
                Barchasi <ChevronRight size={12} />
              </Link>
            </div>
            <ul className="latest">
              {articles.map((a) => (
                <li key={a._id}>
                  <Link to={`/maqola/${a.slug}`} className="latest__item">
                    <div>
                      <ArticleMeta article={a} />
                      <h3 className="article-title latest__title">{a.title}</h3>
                    </div>
                    <span className="latest__thumb">FT</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="home-aside">
          <SideLabel>Jurnal ruknlari</SideLabel>
          <ul className="rubric-list">
            {(rubrics.data || []).map((r) => (
              <li key={r._id}>
                <Link to={`/arxiv?rukn=${r.slug}`} className="rubric-list__item">
                  <span>{r.name}</span>
                  <span className="rubric-list__count">{r.articleCount}</span>
                </Link>
              </li>
            ))}
          </ul>
          <InfoBox title="Mualliflar uchun" linkTo="/chop-etish-tartibi" linkLabel="Batafsil">
            Ilmiy maqolangizni jurnal tahririyatiga yuborish uchun talablar bilan tanishing.
          </InfoBox>
        </aside>
      </div>
    </div>
  );
}
