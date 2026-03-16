export const LESSONS_DATA: Record<string, Record<string, { title: string, videoUrl: string, description: string }>> = {
  'alpha': {
    '1': { 
      title: 'Market Structure 101', 
      videoUrl: 'https://www.youtube.com/embed/4X4uckVyk9o?si=GNVew549TrLuyCs7',
      description: 'Understanding the foundation of market movements through swing highs and lows.'
    },
    '2': { 
      title: 'Liquidity Concepts', 
      videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      description: 'Identifying where the big money is resting and how to use it as a magnet.'
    },
    '3': { 
      title: 'Supply & Demand Zones', 
      videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      description: 'Locating high-probability areas for price reversals and continuations.'
    }
  },
  'sighma': {
    '1': { 
      title: 'The Sighma Entry Model', 
      videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      description: 'Our proprietary entry model for high risk-to-reward setups.'
    }
  }
};

export const COURSES = [
  {
    id: 'alpha',
    title: 'Alpha Module',
    description: 'Master the core concepts of market structure and liquidity.',
    lessonsCount: Object.keys(LESSONS_DATA['alpha']).length,
    duration: '4h 20m',
    level: 'Beginner'
  },
  {
    id: 'sighma',
    title: 'Sighma Module',
    description: 'Advanced entry models and risk management strategies.',
    lessonsCount: Object.keys(LESSONS_DATA['sighma']).length,
    duration: '2h 15m',
    level: 'Advanced'
  }
];
