import { useEffect, useRef } from 'react';
import { MapPin, Home, TreePine, Building, Leaf, Sparkles, ChevronDown, Landmark, School, ShoppingBag, Music } from 'lucide-react';

// Featured community — public brochure page for Central Living at Craig.
// Same content policy as the featured home: community + neighborhood facts
// from public builder marketing only. No pricing, contracts, or deal terms.

const BASE = import.meta.env.BASE_URL || '/';
const img = name => `${BASE}featured/${name}`;

const FACTS = [
  { icon: Building, value: '3-story', label: 'Townhomes' },
  { icon: Home, value: 'Boutique', label: 'Enclave Scale' },
  { icon: TreePine, value: 'Cotswold', label: 'Neighborhood' },
  { icon: Leaf, value: 'EFL®', label: 'Energy Certified' },
];

const PILLARS = [
  { icon: Home, title: 'David Weekley craftsmanship', text: 'Built by one of the country’s largest private builders — 2×6 exterior walls, R-19 insulation, and Environments For Living® energy certification on every home.' },
  { icon: TreePine, title: 'A green at the center', text: 'Homes face a shared community green rather than a parking field, with association-maintained streets and landscaping.' },
  { icon: Landmark, title: 'Close-in address', text: 'Craig Avenue sits in Cotswold, an established southeast-Charlotte neighborhood — about ten minutes to Uptown, minutes to SouthPark.' },
  { icon: School, title: 'Sought-after schools', text: 'Assigned to the Myers Park-area school zone (verify current assignments with Charlotte-Mecklenburg Schools).' },
];

const PLACES = [
  { icon: ShoppingBag, name: 'Cotswold Village Shops', note: 'Groceries, coffee, and daily errands a few minutes from the front door' },
  { icon: Sparkles, name: 'SouthPark', note: 'The Southeast’s premier shopping district, a short drive west' },
  { icon: Music, name: 'Plaza Midwood & NoDa', note: 'Charlotte’s dining and music neighborhoods, minutes north' },
  { icon: Landmark, name: 'Uptown Charlotte', note: 'The center-city commute, about ten minutes door to door' },
];

const SCENES = [
  { src: 'street.jpg', caption: 'The streetscape along Craig Avenue', wide: true },
  { src: 'deck.jpg', caption: 'Balconies over the community entrance' },
  { src: 'deck2.jpg', caption: 'Private outdoor rooms on every plan' },
  { src: 'balcony.jpg', caption: 'Looking across the community green' },
];

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('fc-visible');
      return;
    }
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && (e.target.classList.add('fc-visible'), io.unobserve(e.target))),
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
    <div ref={ref} className={`fc-reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function FeaturedCommunity() {
  return (
    <div className="fc -mx-4 sm:mx-0">
      <style>{`
        .fc-reveal { opacity: 0; transform: translateY(24px); transition: opacity .9s ease, transform .9s ease; }
        .fc-reveal.fc-visible { opacity: 1; transform: none; }
        @keyframes fc-kenburns { from { transform: scale(1.08); } to { transform: scale(1); } }
        @keyframes fc-rise { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
        @keyframes fc-fadein { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fc-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        .fc-hero-img { animation: fc-kenburns 6s ease-out both; }
        .fc-hero-t1 { animation: fc-rise 1s .3s ease both; }
        .fc-hero-t2 { animation: fc-rise 1s .6s ease both; }
        .fc-hero-t3 { animation: fc-rise 1s .9s ease both; }
        .fc-hero-cue { animation: fc-fadein 1s 1.6s ease both, fc-bounce 2s 2.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .fc * { animation: none !important; }
          .fc-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
        }
      `}</style>

      {/* Hero */}
      <section className="relative h-[62vh] min-h-[400px] overflow-hidden sm:rounded-2xl">
        <img src={img('street.jpg')} alt="Central Living at Craig streetscape" className="fc-hero-img absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-slate-900/10" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 text-white">
          <p className="fc-hero-t1 text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-emerald-300">Featured Community</p>
          <h1 className="fc-hero-t2 text-4xl sm:text-6xl font-bold tracking-tight mt-2" style={{ fontFamily: 'Georgia, serif' }}>Central Living at Craig</h1>
          <p className="fc-hero-t3 text-sm sm:text-lg text-slate-200 mt-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-300" />
            A David Weekley Homes enclave · Craig Avenue, Cotswold · Charlotte, NC 28211
          </p>
        </div>
        <div className="fc-hero-cue absolute bottom-4 right-6 text-white/70"><ChevronDown className="w-6 h-6" /></div>
      </section>

      {/* Facts band */}
      <Reveal>
        <section className="bg-slate-900 text-white sm:rounded-2xl mt-3 px-6 py-7">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {FACTS.map((s, i) => (
              <Reveal key={s.label} delay={i * 120} className="text-center">
                <s.icon className="w-5 h-5 mx-auto text-emerald-400 mb-1.5" />
                <p className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>{s.value}</p>
                <p className="text-[11px] uppercase tracking-widest text-slate-400 mt-0.5">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Narrative */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center mt-12 px-4 sm:px-0">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-emerald-600 mb-3">The Community</p>
          <h2 className="text-3xl font-bold text-gray-900 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Small on purpose, in a neighborhood that isn’t going anywhere.
          </h2>
          <p className="text-gray-600 mt-4 leading-relaxed">
            Central Living at Craig is David Weekley’s answer to a rare brief: new construction inside one of Charlotte’s
            established close-in neighborhoods. Instead of a sprawling master plan on the county line, it’s a boutique row
            of three-story townhomes tucked into Cotswold — tree-lined streets, a shared green at the center, and the
            builder’s Central Living line of urban plans designed for lock-and-leave living.
          </p>
          <p className="text-gray-600 mt-3 leading-relaxed">
            The association maintains the streets and landscaping, every home carries David Weekley’s Environments For
            Living® energy certification, and the whole community sits ten minutes from Uptown — close-in Charlotte
            without the close-in chaos.
          </p>
        </Reveal>
        <Reveal delay={150}>
          <figure className="overflow-hidden rounded-2xl shadow-lg group">
            <img src={img('deck.jpg')} alt="Balcony over the community entrance" className="w-full h-72 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-700" />
          </figure>
        </Reveal>
      </section>

      {/* Pillars */}
      <section className="mt-14 px-4 sm:px-0">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-emerald-600 mb-3">Why Here</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>What the community gets right</h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PILLARS.map((f, i) => (
            <Reveal key={f.title} delay={i * 120}>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-full">
                <f.icon className="w-6 h-6 text-emerald-600 mb-3" />
                <h3 className="font-bold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Scenes */}
      <section className="mt-14 px-4 sm:px-0">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-emerald-600 mb-3">Around the Community</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>Streets, greens, and balconies</h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SCENES.map((g, i) => (
            <Reveal key={g.src} delay={i * 120} className={g.wide ? 'sm:col-span-2' : ''}>
              <figure className="relative overflow-hidden rounded-2xl shadow-md group">
                <img src={img(g.src)} alt={g.caption} className={`w-full object-cover group-hover:scale-105 transition-transform duration-700 ${g.wide ? 'h-72 sm:h-[26rem]' : 'h-64 sm:h-80'}`} />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent text-white text-sm px-4 pt-10 pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  {g.caption}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* The featured home, cross-linked */}
      <section className="mt-14 px-4 sm:px-0">
        <Reveal>
          <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl border border-amber-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img src={img('hero.jpg')} alt="3912 Craig Avenue" className="w-full sm:w-56 h-36 object-cover rounded-xl shadow" />
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-amber-600">The Community’s Showcase</p>
              <h3 className="text-xl font-bold text-gray-900 mt-1" style={{ fontFamily: 'Georgia, serif' }}>3912 Craig Avenue — the designer model</h3>
              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                The decorated Remely model that sold the neighborhood, with a full photo walk-through and 3D tour on the Featured Home page.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Neighborhood + links */}
      <section className="mt-14 mb-6 px-4 sm:px-0">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-emerald-600 mb-3">The Neighborhood</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>Between Charlotte’s best districts</h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLACES.map((p, i) => (
            <Reveal key={p.name} delay={i * 120}>
              <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-200 p-5 h-full">
                <p.icon className="w-4 h-4 text-emerald-600 mb-2" />
                <h3 className="font-bold text-gray-900 text-sm">{p.name}</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{p.note}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <a
              href="https://www.davidweekleyhomes.com/new-homes/nc/charlotte/charlotte/central-living-at-craig"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
            >
              <Home className="w-4 h-4" /> Central Living at Craig on davidweekleyhomes.com
            </a>
            <a
              href="https://maps.google.com/?q=Craig+Avenue,+Charlotte,+NC+28211"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition"
            >
              <MapPin className="w-4 h-4" /> View on the map
            </a>
          </div>
        </Reveal>
        <p className="text-[11px] text-gray-400 mt-8">
          Photographs from owner and professional walkthroughs. Community and plan details © David Weekley Homes, from public marketing materials, subject to change.
        </p>
      </section>
    </div>
  );
}
