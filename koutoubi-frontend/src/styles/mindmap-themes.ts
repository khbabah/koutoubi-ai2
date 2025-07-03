// Professional color themes for mindmap visualization

export interface MindmapTheme {
  name: string;
  background: string;
  nodeColors: string[];
  textColors: {
    primary: string;
    secondary: string;
    onDark: string;
    onLight: string;
  };
  linkColors: {
    default: string;
    hover: string;
  };
  expandButton: {
    bg: string;
    border: string;
    hoverBg: string;
    text: string;
  };
}

// Modern Professional Theme - Clean and readable
export const modernTheme: MindmapTheme = {
  name: 'modern',
  background: '#FAFBFC',
  nodeColors: [
    '#4F46E5', // Indigo - Root
    '#7C3AED', // Purple - Branch 1
    '#2563EB', // Blue - Branch 2
    '#0891B2', // Cyan - Branch 3
    '#059669', // Emerald - Branch 4
    '#DC2626', // Red - Branch 5
    '#EA580C', // Orange - Branch 6
    '#D97706', // Amber - Branch 7
    '#0D9488', // Teal - Branch 8
    '#DB2777', // Pink - Branch 9
  ],
  textColors: {
    primary: '#1F2937',
    secondary: '#6B7280',
    onDark: '#FFFFFF',
    onLight: '#1F2937',
  },
  linkColors: {
    default: '#E5E7EB',
    hover: '#9CA3AF',
  },
  expandButton: {
    bg: '#EEF2FF',
    border: '#6366F1',
    hoverBg: '#E0E7FF',
    text: '#4F46E5',
  },
};

// Soft Pastel Theme - Easy on the eyes
export const pastelTheme: MindmapTheme = {
  name: 'pastel',
  background: '#FEF9F3',
  nodeColors: [
    '#8B5CF6', // Violet - Root
    '#A78BFA', // Light Violet - Branch 1
    '#60A5FA', // Light Blue - Branch 2
    '#34D399', // Emerald - Branch 3
    '#FCD34D', // Amber - Branch 4
    '#F87171', // Light Red - Branch 5
    '#FB923C', // Light Orange - Branch 6
    '#FBBF24', // Yellow - Branch 7
    '#A3E635', // Lime - Branch 8
    '#86EFAC', // Light Green - Branch 9
    '#67E8F9', // Light Cyan - Branch 10
  ],
  textColors: {
    primary: '#374151',
    secondary: '#6B7280',
    onDark: '#FFFFFF',
    onLight: '#1F2937',
  },
  linkColors: {
    default: '#FED7AA',
    hover: '#FDBA74',
  },
  expandButton: {
    bg: '#F3E8FF',
    border: '#9333EA',
    hoverBg: '#EDE9FE',
    text: '#7C3AED',
  },
};

// Dark Professional Theme
export const darkTheme: MindmapTheme = {
  name: 'dark',
  background: '#0F172A',
  nodeColors: [
    '#6366F1', // Indigo - Root
    '#8B5CF6', // Purple - Branch 1
    '#3B82F6', // Blue - Branch 2
    '#06B6D4', // Cyan - Branch 3
    '#10B981', // Emerald - Branch 4
    '#F59E0B', // Amber - Branch 5
    '#EF4444', // Red - Branch 6
    '#EC4899', // Pink - Branch 7
    '#14B8A6', // Teal - Branch 8
    '#84CC16', // Lime - Branch 9
    '#F97316', // Orange - Branch 10
  ],
  textColors: {
    primary: '#F9FAFB',
    secondary: '#D1D5DB',
    onDark: '#FFFFFF',
    onLight: '#0F172A',
  },
  linkColors: {
    default: '#334155',
    hover: '#475569',
  },
  expandButton: {
    bg: '#1E293B',
    border: '#60A5FA',
    hoverBg: '#334155',
    text: '#93C5FD',
  },
};

// Nature Theme - Green and earthy
export const natureTheme: MindmapTheme = {
  name: 'nature',
  background: '#F0FDF4',
  nodeColors: [
    '#166534', // Dark Green - Root
    '#16A34A', // Green - Branch 1
    '#22C55E', // Light Green - Branch 2
    '#84CC16', // Lime - Branch 3
    '#EAB308', // Yellow - Branch 4
    '#F97316', // Orange - Branch 5
    '#0EA5E9', // Sky Blue - Branch 6
    '#059669', // Emerald - Branch 7
    '#D97706', // Amber - Branch 8
    '#7C2D12', // Brown - Branch 9
    '#0891B2', // Cyan - Branch 10
  ],
  textColors: {
    primary: '#166534',
    secondary: '#15803D',
    onDark: '#FFFFFF',
    onLight: '#166534',
  },
  linkColors: {
    default: '#BBF7D0',
    hover: '#86EFAC',
  },
  expandButton: {
    bg: '#DCFCE7',
    border: '#16A34A',
    hoverBg: '#BBF7D0',
    text: '#166534',
  },
};

// Ocean Theme - Blues and teals
export const oceanTheme: MindmapTheme = {
  name: 'ocean',
  background: '#F0F9FF',
  nodeColors: [
    '#0C4A6E', // Dark Blue - Root
    '#0369A1', // Blue - Branch 1
    '#0284C7', // Light Blue - Branch 2
    '#0891B2', // Cyan - Branch 3
    '#0D9488', // Teal - Branch 4
    '#059669', // Emerald - Branch 5
    '#10B981', // Light Emerald - Branch 6
    '#14B8A6', // Light Teal - Branch 7
    '#06B6D4', // Sky - Branch 8
    '#0EA5E9', // Light Sky - Branch 9
    '#6366F1', // Indigo - Branch 10
  ],
  textColors: {
    primary: '#0C4A6E',
    secondary: '#075985',
    onDark: '#FFFFFF',
    onLight: '#0C4A6E',
  },
  linkColors: {
    default: '#BAE6FD',
    hover: '#7DD3FC',
  },
  expandButton: {
    bg: '#E0F2FE',
    border: '#0284C7',
    hoverBg: '#BAE6FD',
    text: '#0369A1',
  },
};

// Get theme by name
export const getTheme = (themeName: string): MindmapTheme => {
  switch (themeName) {
    case 'pastel':
      return pastelTheme;
    case 'dark':
      return darkTheme;
    case 'nature':
      return natureTheme;
    case 'ocean':
      return oceanTheme;
    default:
      return modernTheme;
  }
};

// Generate CSS for a theme
export const generateThemeCSS = (theme: MindmapTheme): string => {
  return `
    /* Background */
    .mindmap-container {
      background: ${theme.background};
    }
    
    /* Node colors by depth */
    .markmap-node[data-depth="0"] rect {
      fill: ${theme.nodeColors[0]};
    }
    ${theme.nodeColors.slice(1).map((color, i) => `
    .markmap-node[data-depth="${i + 1}"] rect {
      fill: ${color};
    }`).join('')}
    
    /* Text colors */
    .markmap-node text {
      fill: ${theme.textColors.onDark};
    }
    .markmap-node.light-bg text {
      fill: ${theme.textColors.onLight};
    }
    
    /* Links */
    .markmap-link {
      stroke: ${theme.linkColors.default};
      stroke-width: 2;
      opacity: 0.8;
    }
    .markmap-link:hover {
      stroke: ${theme.linkColors.hover};
      stroke-width: 3;
    }
    
    /* Expand/collapse buttons */
    g.markmap-expand-g circle {
      fill: ${theme.expandButton.bg} !important;
      stroke: ${theme.expandButton.border} !important;
    }
    g.markmap-expand-g:hover circle {
      fill: ${theme.expandButton.hoverBg} !important;
    }
    g.markmap-expand-g text {
      fill: ${theme.expandButton.text} !important;
    }
  `;
};

// Apply gradient effects for smoother transitions
export const generateGradientDefs = (theme: MindmapTheme): string => {
  return theme.nodeColors.map((color, i) => `
    <linearGradient id="gradient-${i}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${adjustColor(color, -20)};stop-opacity:1" />
    </linearGradient>
  `).join('');
};

// Helper function to darken/lighten colors
function adjustColor(color: string, amount: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}