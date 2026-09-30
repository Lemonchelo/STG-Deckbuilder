/**
 * AETHERIUM TCG - MASTER CARD DATABASE
 * Planetary factions (excluding Venus & Sun).
 * Types: Criatura, HechizoRapido, HechizoLento, Estructura, Artefacto, Sello, Terreno, Token.
 */

export const ELEMENTS = {
  marte: { iconSrc: 'assets/factions/marte.png', name: 'Marte', icon: '🔴', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.45)' },
  neptuno: { iconSrc: 'assets/factions/neptuno.png', name: 'Neptuno', icon: '🔵', color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.45)' },
  jupiter: { iconSrc: 'assets/factions/jupiter.png', name: 'Júpiter', icon: '🟠', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.45)' },
  tierra: { iconSrc: 'assets/factions/tierra.png', name: 'Tierra', icon: '🟢', color: '#10b981', glow: 'rgba(16, 185, 129, 0.45)' },
  saturno: { iconSrc: 'assets/factions/saturno.png', name: 'Saturno', icon: '🪐', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.45)' },
  mercurio: { iconSrc: 'assets/factions/mercurio.png', name: 'Mercurio', icon: '⚪', color: '#cbd5e1', glow: 'rgba(203, 213, 225, 0.45)' },
  pluton: { iconSrc: 'assets/factions/pluton.png', name: 'Plutón', icon: '🌌', color: '#ec4899', glow: 'rgba(236, 72, 153, 0.45)' },
  neutral: { name: 'Arcano', icon: '🔮', color: '#94a3b8', glow: 'rgba(148, 163, 184, 0.3)' }
};

export function renderElementIcon(elementKey) {
  const element = ELEMENTS[elementKey] || ELEMENTS.neutral;
  return element.iconSrc
    ? `<img class="faction-icon" src="${element.iconSrc}" alt="" width="20" height="20" draggable="false">`
    : element.icon;
}

export const CARD_TYPES = [
  { id: 'all', label: 'Todos' },
  { id: 'Criatura', label: 'Criatura' },
  { id: 'HechizoRapido', label: 'Hechizo Rápido' },
  { id: 'HechizoLento', label: 'Hechizo Lento' },
  { id: 'Estructura', label: 'Estructura' },
  { id: 'Artefacto', label: 'Artefacto' },
  { id: 'Sello', label: 'Sello (Recurso)' },
  { id: 'Terreno', label: 'Terreno' }
];

export function makeFullCardSvg(name, planetKey, type, rarity, cost, atk, def, desc, bgGrad1, bgGrad2, accentColor) {
  const elem = ELEMENTS[planetKey] || ELEMENTS.neutral;
  const isCreatureOrToken = (atk !== null && def !== null);
  const isSello = type === 'Sello';

  return `<svg viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" class="full-card-svg">
    <defs>
      <linearGradient id="bg_${name.replace(/\s+/g, '')}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGrad1 || '#1e293b'}" />
        <stop offset="50%" stop-color="#0a0f1d" />
        <stop offset="100%" stop-color="${bgGrad2 || '#0f172a'}" />
      </linearGradient>
      <radialGradient id="gem_${name.replace(/\s+/g, '')}" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="40%" stop-color="${accentColor || '#38bdf8'}" />
        <stop offset="100%" stop-color="#090d18" />
      </radialGradient>
      <filter id="glow_${name.replace(/\s+/g, '')}">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- Outer Card Frame -->
    <rect width="250" height="350" rx="14" fill="url(#bg_${name.replace(/\s+/g, '')})" stroke="${accentColor || '#38bdf8'}" stroke-width="${isSello ? 4.5 : 3.5}"/>
    <rect x="8" y="8" width="234" height="334" rx="10" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>

    <!-- Top Header Banner -->
    <rect x="12" y="14" width="226" height="34" rx="6" fill="rgba(8,12,24,0.85)" stroke="${accentColor || '#38bdf8'}" stroke-width="1.5"/>
    
    <!-- Cost / Sello Icon (Top Left) -->
    <circle cx="30" cy="31" r="15" fill="url(#gem_${name.replace(/\s+/g, '')})" stroke="#ffffff" stroke-width="2" filter="url(#glow_${name.replace(/\s+/g, '')})"/>
    <text x="30" y="36" font-family="'JetBrains Mono', monospace" font-size="${isSello ? '11' : '14'}" font-weight="900" fill="#ffffff" text-anchor="middle">${isSello ? '💎' : cost}</text>

    <!-- Card Title -->
    <text x="125" y="36" font-family="'Cinzel', serif" font-size="11.5" font-weight="800" fill="#ffffff" text-anchor="middle">${name}</text>

    <!-- Planet Symbol (Top Right) -->
    ${elem.iconSrc
      ? `<image href="${elem.iconSrc}" x="212" y="21" width="20" height="20"/>`
      : `<text x="222" y="36" font-size="14" text-anchor="middle">${elem.icon}</text>`}

    <!-- Central Art Illustration Window -->
    <rect x="16" y="54" width="218" height="155" rx="8" fill="#060913" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    
    <!-- Procedural Artwork Graphic -->
    <circle cx="125" cy="130" r="50" fill="${accentColor || '#38bdf8'}" opacity="0.25" filter="url(#glow_${name.replace(/\s+/g, '')})"/>
    ${isSello ? `
      <!-- Sello Rune Graphic -->
      <circle cx="125" cy="130" r="40" fill="none" stroke="${accentColor || '#38bdf8'}" stroke-width="4" stroke-dasharray="8 4"/>
      <polygon points="125,95 155,145 95,145" fill="${accentColor || '#38bdf8'}" opacity="0.8"/>
      <circle cx="125" cy="130" r="16" fill="#ffffff"/>
    ` : `
      <polygon points="125,75 165,130 145,175 105,175 85,130" fill="${accentColor || '#38bdf8'}" opacity="0.8"/>
      <circle cx="125" cy="130" r="24" fill="#ffffff" opacity="0.9"/>
      <circle cx="125" cy="130" r="14" fill="#0a0f1d"/>
    `}

    <!-- Ribbon: Planet Name, Type & Rarity -->
    <rect x="16" y="213" width="218" height="20" rx="4" fill="rgba(12,18,34,0.95)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <text x="26" y="227" font-family="'Outfit', sans-serif" font-size="9.5" font-weight="700" fill="${accentColor || '#38bdf8'}" text-transform="uppercase">${elem.name} • ${type}</text>
    <text x="224" y="227" font-family="'Outfit', sans-serif" font-size="9.5" font-weight="700" fill="#fbbf24" text-anchor="end">${rarity || ''}</text>

    <!-- Ability & Description Box -->
    <rect x="16" y="238" width="218" height="66" rx="6" fill="rgba(8,12,24,0.92)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <foreignObject x="22" y="242" width="206" height="58">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Outfit', sans-serif; font-size: 10px; line-height: 1.35; color: #e2e8f0; text-align: center; display: flex; align-items: center; justify-content: center; height: 100%;">
        ${desc || ''}
      </div>
    </foreignObject>

    <!-- Creature / Token Stats Footer -->
    ${isCreatureOrToken ? `
      <polygon points="32,298 48,312 48,332 32,342 16,332 16,312" fill="#dc2626" stroke="#f87171" stroke-width="1.5"/>
      <text x="32" y="326" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle">${atk}</text>

      <polygon points="218,298 234,312 234,332 218,342 202,332 202,312" fill="#16a34a" stroke="#4ade80" stroke-width="1.5"/>
      <text x="218" y="326" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle">${def}</text>
    ` : ''}
  </svg>`;
}

/**
 * MASTER CARD COLLECTION
 * Initialized as empty so user can import their own custom cards.
 */
export const CARDS_DATA = [];

export function getCardById(id) {
  return CARDS_DATA.find(c => c.id === id);
}

// Búsqueda exacta por nombre (sin distinguir mayúsculas/espacios extremos), para archivos
// como cartas/banlist-default.json que identifican cartas por nombre en vez de id interno.
export function getCardByName(name) {
  const q = String(name).trim().toLowerCase();
  return CARDS_DATA.find(c => c.name.trim().toLowerCase() === q);
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
}
