const lessonRawGlob = import.meta.glob<string>(
  "../content/tracks/*/modules/*/lessons/*.md",
  { query: "?raw", import: "default", eager: true }
);

const challengeJsonGlob = import.meta.glob<{ title: string }>(
  "../content/tracks/*/modules/*/challenges/*.json",
  { eager: true, import: "default" }
);

function extractH1(md: string): string {
  const m = /^#\s+(.+)$/m.exec(md);
  return m ? m[1].trim() : "";
}

// Key: "trackId:moduleId/lessonId"
const lessonTitles = new Map<string, string>();
for (const [path, raw] of Object.entries(lessonRawGlob)) {
  const m = /tracks\/([^/]+)\/modules\/([^/]+)\/lessons\/([^/]+)\.md$/.exec(path);
  if (m) {
    lessonTitles.set(`${m[1]}:${m[2]}/${m[3]}`, extractH1(raw as string));
  }
}

// Key: "trackId:moduleId/challengeId"
const challengeTitles = new Map<string, string>();
for (const [path, data] of Object.entries(challengeJsonGlob)) {
  const m = /tracks\/([^/]+)\/modules\/([^/]+)\/challenges\/([^/]+)\.json$/.exec(path);
  if (m && data?.title) {
    challengeTitles.set(`${m[1]}:${m[2]}/${m[3]}`, data.title);
  }
}

export function getLessonTitle(trackId: string, moduleId: string, lessonId: string): string {
  return lessonTitles.get(`${trackId}:${moduleId}/${lessonId}`) ?? lessonId;
}

export function getChallengeTitle(trackId: string, moduleId: string, challengeId: string): string {
  return challengeTitles.get(`${trackId}:${moduleId}/${challengeId}`) ?? challengeId;
}
