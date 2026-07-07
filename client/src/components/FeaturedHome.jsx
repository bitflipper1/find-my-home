import { useEffect, useRef, useState, useCallback } from 'react';
import { BedDouble, Bath, Ruler, Building, Car, MapPin, Sparkles, Leaf, Home, TreePine, X, ChevronDown } from 'lucide-react';

// Featured property — public brochure page for 3912 Craig Ave.
// Content policy: property + community + neighborhood facts only (what the
// builder markets publicly). No pricing, contract, financing, or deal terms.

const BASE = import.meta.env.BASE_URL || '/';
const img = name => `${BASE}featured/${name}`;

const STATS = [
  { icon: BedDouble, value: '2', label: 'Bedrooms' },
  { icon: Bath, value: '2.5', label: 'Baths' },
  { icon: Ruler, value: '1,569', label: 'Square Feet' },
  { icon: Building, value: '3', label: 'Stories' },
  { icon: Car, value: 'Attached', label: 'Garage' },
];

const GALLERY = [
  { src: 'kitchen.jpg', caption: 'Granite island kitchen, open to the living room', wide: true },
  { src: 'dining.jpg', caption: 'Sun-filled dining with oversized windows' },
  { src: 'bedroom.jpg', caption: 'Designer primary suite' },
  { src: 'bedroom2.jpg', caption: 'Guest bedroom with en-suite bath' },
  { src: 'balcony.jpg', caption: 'Covered balcony over the community greenbelt' },
];

const FEATURES = [
  { icon: Sparkles, title: 'Professionally designed', text: 'A David Weekley Homes decorated model — designer accent walls, curated lighting, and finishes selected by the builder’s design studio.' },
  { icon: Home, title: 'Open-concept living', text: 'Granite island kitchen with stainless appliances flowing into the living and dining rooms, wrapped in oversized windows.' },
  { icon: Leaf, title: 'Built to a higher spec', text: '2×6 exterior walls with R-19 insulation and Environments For Living® energy certification — quieter, tighter, cheaper to run.' },
  { icon: TreePine, title: 'Low-maintenance enclave', text: 'A boutique community of three-story townhomes with association-maintained streets and landscaping.' },
];

const PLACES = [
  { name: 'Cotswold Village Shops', note: 'Groceries, coffee, and retail a few minutes from the front door' },
  { name: 'SouthPark', note: 'The Southeast’s premier shopping district, a short drive west' },
  { name: 'Plaza Midwood & NoDa', note: 'Charlotte’s dining and music neighborhoods, minutes north' },
  { name: 'Uptown Charlotte', note: 'The center city commute, about ten minutes door to door' },
];

// Scroll-reveal: adds .fh-visible when the element enters the viewport.
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('fh-visible');
      return;
    }
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && (e.target.classList.add('fh-visible'), io.unobserve(e.target))),
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, delay = 0, className = '' }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`fh-reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function FeaturedHome() {
  const [lightbox, setLightbox] = useState(null);
  const close = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (lightbox == null) return;
    const onKey = e => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, close]);

  return (
    <div className="fh -mx-4 sm:mx-0">
      <style>{`
        .fh-reveal { opacity: 0; transform: translateY(24px); transition: opacity .9s ease, transform .9s ease; }
        .fh-reveal.fh-visible { opacity: 1; transform: none; }
        @keyframes fh-kenburns { from { transform: scale(1.08); } to { transform: scale(1); } }
        @keyframes fh-fadein { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fh-rise { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
        @keyframes fh-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        .fh-hero-img { animation: fh-kenburns 6s ease-out both; }
        .fh-hero-t1 { animation: fh-rise 1s .3s ease both; }
        .fh-hero-t2 { animation: fh-rise 1s .6s ease both; }
        .fh-hero-t3 { animation: fh-rise 1s .9s ease both; }
        .fh-hero-cue { animation: fh-fadein 1s 1.6s ease both, fh-bounce 2s 2.6s ease-in-out infinite; }
        .fh-lightbox { animation: fh-fadein .25s ease both; }
        @media (prefers-reduced-motion: reduce) {
          .fh * { animation: none !important; }
          .fh-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
        }
      `}</style>

      {/* Hero */}
      <section className="relative h-[68vh] min-h-[420px] overflow-hidden sm:rounded-2xl">
        <img src={img('hero.jpg')} alt="Central Living at Craig townhomes" className="fh-hero-img absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-slate-900/10" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 text-white">
          <p className="fh-hero-t1 text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-amber-300">Featured Home · Designer Model</p>
          <h1 className="fh-hero-t2 text-4xl sm:text-6xl font-bold tracking-tight mt-2" style={{ fontFamily: 'Georgia, serif' }}>3912 Craig Avenue</h1>
          <p className="fh-hero-t3 text-sm sm:text-lg text-slate-200 mt-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-300" />
            The Remely · Central Living at Craig by David Weekley Homes · Cotswold, Charlotte, NC
          </p>
        </div>
        <div className="fh-hero-cue absolute bottom-4 right-6 text-white/70"><ChevronDown className="w-6 h-6" /></div>
      </section>

      {/* Stats band */}
      <Reveal>
        <section className="bg-slate-900 text-white sm:rounded-2xl mt-3 px-6 py-7">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 max-w-4xl mx-auto">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 120} className="text-center">
                <s.icon className="w-5 h-5 mx-auto text-amber-400 mb-1.5" />
                <p className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>{s.value}</p>
                <p className="text-[11px] uppercase tracking-widest text-slate-400 mt-0.5">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Narrative + balcony image */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center mt-12 px-4 sm:px-0">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-amber-600 mb-3">The Home</p>
          <h2 className="text-3xl font-bold text-gray-900 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            The model the builder used to sell the neighborhood.
          </h2>
          <p className="text-gray-600 mt-4 leading-relaxed">
            Every community gets one showcase home — the one the design studio furnishes, the one every tour walks through
            first. This is that home. The Remely is a three-story townhome at the front of Central Living at Craig,
            David Weekley’s boutique enclave in Cotswold, finished the way the catalog photos promise and kept
            showroom-perfect since the day it opened.
          </p>
          <p className="text-gray-600 mt-3 leading-relaxed">
            The main level lives large for its footprint: a granite island kitchen anchors an open plan that runs
            window-to-window, and a covered balcony looks over the community green instead of a parking lot.
          </p>
        </Reveal>
        <Reveal delay={150}>
          <figure className="overflow-hidden rounded-2xl shadow-lg cursor-pointer group" onClick={() => setLightbox(4)}>
            <img src={img('balcony.jpg')} alt="Balcony view over the greenbelt" className="w-full h-72 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-700" />
          </figure>
        </Reveal>
      </section>

      {/* Gallery */}
      <section className="mt-14 px-4 sm:px-0">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-amber-600 mb-3">Inside</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>A designer’s walk-through</h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GALLERY.slice(0, 4).map((g, i) => (
            <Reveal key={g.src} delay={i * 120} className={g.wide ? 'sm:col-span-2' : ''}>
              <figure className="relative overflow-hidden rounded-2xl shadow-md cursor-pointer group" onClick={() => setLightbox(i)}>
                <img src={img(g.src)} alt={g.caption} className={`w-full object-cover group-hover:scale-105 transition-transform duration-700 ${g.wide ? 'h-72 sm:h-[28rem]' : 'h-64 sm:h-80'}`} />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent text-white text-sm px-4 pt-10 pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  {g.caption}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 3D tour */}
      <section className="mt-14 px-4 sm:px-0">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-amber-600 mb-3">Walk Through It</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>Take the 3D tour</h2>
          <p className="text-gray-600 mb-6 max-w-2xl leading-relaxed">
            Every room, at your own pace — the full Matterport scan of the home. Click to start, drag to look around,
            and use the floor selector to move between all three stories.
          </p>
        </Reveal>
        <Reveal delay={150}>
          <div className="relative overflow-hidden rounded-2xl shadow-lg bg-slate-900" style={{ aspectRatio: '16 / 9' }}>
            <iframe
              src="https://my.matterport.com/show/?m=phwXrstWukD"
              title="3D tour of 3912 Craig Avenue"
              className="absolute inset-0 w-full h-full border-0"
              allow="xr-spatial-tracking; fullscreen; vr"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <a
              href="https://my.matterport.com/show/?m=phwXrstWukD"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition"
            >
              <Sparkles className="w-4 h-4" /> Open the tour full screen
            </a>
            <a
              href="https://www.davidweekleyhomes.com/new-homes/nc/charlotte/charlotte/central-living-at-craig/remely"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition"
            >
              <Home className="w-4 h-4" /> The Remely on davidweekleyhomes.com
            </a>
          </div>
        </Reveal>
      </section>

      {/* Features */}
      <section className="mt-14 px-4 sm:px-0">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-amber-600 mb-3">Why it stands out</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>Built and finished differently</h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 120}>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-full">
                <f.icon className="w-6 h-6 text-amber-500 mb-3" />
                <h3 className="font-bold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Neighborhood */}
      <section className="mt-14 mb-6 px-4 sm:px-0">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-amber-600 mb-3">The Neighborhood</p>
          <h2 className="text-3xl font-bold text-gray-900 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Cotswold: close-in Charlotte, without the close-in chaos
          </h2>
          <p className="text-gray-600 mt-4 max-w-3xl leading-relaxed">
            Central Living at Craig sits in Cotswold, one of Charlotte’s established southeast neighborhoods — tree-lined,
            walkable to daily errands, and positioned between the city’s best districts rather than far from all of them.
            The address is assigned to the Myers Park-area school zone (verify current assignments with CMS).
          </p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {PLACES.map((p, i) => (
            <Reveal key={p.name} delay={i * 120}>
              <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl border border-amber-200 p-5 h-full">
                <MapPin className="w-4 h-4 text-amber-600 mb-2" />
                <h3 className="font-bold text-gray-900 text-sm">{p.name}</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{p.note}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <a
            href="https://maps.google.com/?q=3912+Craig+Avenue,+Charlotte,+NC+28211"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition"
          >
            <MapPin className="w-4 h-4" /> View on the map
          </a>
        </Reveal>
        <p className="text-[11px] text-gray-400 mt-8">
          Photographs by the owner. 3D tour and community/plan details © David Weekley Homes, from public marketing materials, subject to change.
        </p>
      </section>

      {/* Lightbox */}
      {lightbox != null && (
        <div className="fh-lightbox fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4" onClick={close}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={close}><X className="w-7 h-7" /></button>
          <figure className="max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <img src={img(GALLERY[lightbox].src)} alt={GALLERY[lightbox].caption} className="w-full max-h-[82vh] object-contain rounded-lg" />
            <figcaption className="text-center text-slate-300 text-sm mt-3">{GALLERY[lightbox].caption}</figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
