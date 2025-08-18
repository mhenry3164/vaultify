export const ASSET_CATEGORIES = {
  // Original categories
  electronics: 'Electronics',
  jewelry: 'Jewelry', 
  furniture: 'Furniture',
  appliances: 'Appliances',
  clothing: 'Clothing',
  art: 'Art',
  books: 'Books',
  tools: 'Tools',
  sports: 'Sports',
  // Phase 1 new categories
  firearms: 'Firearms',
  musical_instruments: 'Musical Instruments',
  collectibles: 'Collectibles',
  home_office: 'Home Office Equipment',
  // Phase 2 categories
  outdoor_equipment: 'Outdoor Equipment',
  kitchen_dining: 'Kitchen & Dining',
  home_improvement: 'Home Improvement',
  automotive: 'Automotive',
  // Phase 3 categories
  toys_games: 'Toys & Games',
  health_medical: 'Health & Medical',
  // Keep other as fallback
  other: 'Other',
} as const;

export type AssetCategory = keyof typeof ASSET_CATEGORIES;

export const CATEGORY_ICONS: Record<AssetCategory, string> = {
  electronics: '📱',
  jewelry: '💎',
  furniture: '🪑',
  appliances: '🏠',
  clothing: '👕',
  art: '🖼️',
  books: '📚',
  tools: '🔧',
  sports: '⚽',
  firearms: '🔫',
  musical_instruments: '🎸',
  collectibles: '🏆',
  home_office: '💻',
  outdoor_equipment: '🏕️',
  kitchen_dining: '🍽️',
  home_improvement: '🔨',
  automotive: '🚗',
  toys_games: '🧸',
  health_medical: '🏥',
  other: '📦',
};

export const CATEGORY_OPTIONS = Object.entries(ASSET_CATEGORIES).map(([value, label]) => ({
  value: value as AssetCategory,
  label,
}));

export const CATEGORY_PIPE_STRING = Object.keys(ASSET_CATEGORIES).join('|');

export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category as AssetCategory] || CATEGORY_ICONS.other;
}

export function getCategoryLabel(category: string): string {
  return ASSET_CATEGORIES[category as AssetCategory] || ASSET_CATEGORIES.other;
}
