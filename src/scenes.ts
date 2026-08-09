export interface Scene {
  id: string;
  title: string;
  subtitle: string;
  src: string;
  color: string;
  emoji: string;
}

const sceneAsset = (filename: string) => `${import.meta.env.BASE_URL}scenes/${filename}`;

export const SCENES: Scene[] = [
  {
    id: 'seaside-friends',
    title: 'Seaside Friends',
    subtitle: 'Sail into a sunny adventure',
    src: sceneAsset('seaside-friends.webp'),
    color: '#12aebb',
    emoji: '⛵',
  },
  {
    id: 'moonlight-music',
    title: 'Moonlight Music',
    subtitle: 'Join the woodland concert',
    src: sceneAsset('moonlight-music.webp'),
    color: '#5b4cb2',
    emoji: '🌙',
  },
  {
    id: 'sky-garden',
    title: 'Sky Garden',
    subtitle: 'Grow flowers above the clouds',
    src: sceneAsset('sky-garden.webp'),
    color: '#ec6d48',
    emoji: '🎈',
  },
  {
    id: 'pocket-raceway',
    title: 'Pocket Raceway',
    subtitle: 'Zoom around the mountain bends',
    src: sceneAsset('pocket-raceway.webp'),
    color: '#e85c47',
    emoji: '🏎️',
  },
  {
    id: 'coral-carnival',
    title: 'Coral Carnival',
    subtitle: 'Join the undersea parade',
    src: sceneAsset('coral-carnival.webp'),
    color: '#1c91c6',
    emoji: '🐋',
  },
  {
    id: 'dinosaur-valley',
    title: 'Dinosaur Valley',
    subtitle: 'Share a prehistoric picnic',
    src: sceneAsset('dinosaur-valley.webp'),
    color: '#a86b36',
    emoji: '🦕',
  },
  {
    id: 'little-moon-base',
    title: 'Little Moon Base',
    subtitle: 'Grow a garden among the stars',
    src: sceneAsset('little-moon-base.webp'),
    color: '#735bb7',
    emoji: '🚀',
  },
  {
    id: 'market-morning',
    title: 'Market Morning',
    subtitle: 'Explore a busy animal village',
    src: sceneAsset('market-morning.webp'),
    color: '#c88428',
    emoji: '🧺',
  },
  {
    id: 'aurora-camp',
    title: 'Aurora Camp',
    subtitle: 'Discover lights in the Arctic sky',
    src: sceneAsset('aurora-camp.webp'),
    color: '#3768a7',
    emoji: '🌌',
  },
];
