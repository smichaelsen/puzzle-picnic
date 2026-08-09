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
];
