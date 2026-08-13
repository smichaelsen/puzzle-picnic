export interface Scene {
  id: string;
  title: string;
  subtitle: string;
  src: string;
  color: string;
  emoji: string;
}

export const SCENE_BUCKET_SIZE = 3;
export const REQUIRED_SOLVES_PER_BUCKET = 2;

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
  {
    id: 'pancake-parade',
    title: 'Pancake Parade',
    subtitle: 'Flip up a comic breakfast feast',
    src: sceneAsset('pancake-parade.webp'),
    color: '#e76a35',
    emoji: '🥞',
  },
  {
    id: 'table-for-everyone',
    title: 'Table for Everyone',
    subtitle: 'Share a garden table full of food',
    src: sceneAsset('table-for-everyone.webp'),
    color: '#748b3d',
    emoji: '🍽️',
  },
  {
    id: 'flavor-mosaic',
    title: 'Flavor Mosaic',
    subtitle: 'Find patterns in every plate',
    src: sceneAsset('flavor-mosaic.webp'),
    color: '#d8555c',
    emoji: '🍊',
  },
  {
    id: 'mud-mountain-rally',
    title: 'Mud Mountain Rally',
    subtitle: 'Roar across a muddy canyon course',
    src: sceneAsset('mud-mountain-rally.webp'),
    color: '#c45f32',
    emoji: '🛻',
  },
  {
    id: 'dragon-meadow',
    title: 'Dragon Meadow',
    subtitle: 'Meet the gentlest flyers in the hills',
    src: sceneAsset('dragon-meadow.webp'),
    color: '#7662a8',
    emoji: '🐉',
  },
  {
    id: 'playtime-park',
    title: 'Playtime Park',
    subtitle: 'Climb, swing and slide together',
    src: sceneAsset('playtime-park.webp'),
    color: '#249a91',
    emoji: '🛝',
  },
  {
    id: 'bumble-splash',
    title: 'Bumble Splash',
    subtitle: 'Dance through the garden spray',
    src: sceneAsset('bumble-splash.webp'),
    color: '#e3a516',
    emoji: '🐝',
  },
  {
    id: 'alpine-express',
    title: 'Alpine Express',
    subtitle: 'Ride the rails through the mountains',
    src: sceneAsset('alpine-express.webp'),
    color: '#237f7c',
    emoji: '🚂',
  },
  {
    id: 'rocket-sunrise',
    title: 'Rocket Sunrise',
    subtitle: 'Cheer a bright voyage to the stars',
    src: sceneAsset('rocket-sunrise.webp'),
    color: '#6b4bb7',
    emoji: '🚀',
  },
];

export function sceneBuckets(): Scene[][] {
  return Array.from({ length: Math.ceil(SCENES.length / SCENE_BUCKET_SIZE) }, (_, bucketIndex) =>
    SCENES.slice(bucketIndex * SCENE_BUCKET_SIZE, (bucketIndex + 1) * SCENE_BUCKET_SIZE),
  );
}

export function solvedInBucket(bucketIndex: number, solvedSceneIds: ReadonlySet<string>): number {
  const start = bucketIndex * SCENE_BUCKET_SIZE;
  return SCENES.slice(start, start + SCENE_BUCKET_SIZE).filter((scene) => solvedSceneIds.has(scene.id)).length;
}

export function isSceneUnlocked(sceneIndex: number, solvedSceneIds: ReadonlySet<string>): boolean {
  const bucketIndex = Math.floor(sceneIndex / SCENE_BUCKET_SIZE);
  if (bucketIndex === 0) return true;
  return solvedInBucket(bucketIndex - 1, solvedSceneIds) >= REQUIRED_SOLVES_PER_BUCKET;
}
