export interface YoutubeDayRotation {
  dayOfWeek: number;
  dayName: string;
  channel: string;
  topic: string;
}

export const YOUTUBE_ROTATION: YoutubeDayRotation[] = [
  { dayOfWeek: 1, dayName: 'Monday', channel: 'Matt Wolfe', topic: 'AI, LLMs, AI agents, new models' },
  { dayOfWeek: 2, dayName: 'Tuesday', channel: 'Fireship', topic: 'Programming languages, frameworks, developer tools' },
  { dayOfWeek: 3, dayName: 'Wednesday', channel: 'TechLinked', topic: 'Global technology news, startups, Big Tech' },
  { dayOfWeek: 4, dayName: 'Thursday', channel: 'AI Explained', topic: 'AI research and ML breakthroughs' },
  { dayOfWeek: 5, dayName: 'Friday', channel: 'ByteByteGo', topic: 'System design, architecture, scalability' },
  { dayOfWeek: 6, dayName: 'Saturday', channel: 'Hussein Nasser', topic: 'Backend, databases, networking, DevOps' },
  { dayOfWeek: 0, dayName: 'Sunday', channel: 'Two Minute Papers', topic: 'Robotics, research, emerging technologies' },
];

export function getYoutubeChannelForDay(dayOfWeek: number): YoutubeDayRotation {
  return (
    YOUTUBE_ROTATION.find((item) => item.dayOfWeek === dayOfWeek) ?? YOUTUBE_ROTATION[0]!
  );
}

export interface ReadingResource {
  id: string;
  name: string;
  url: string;
  role: string;
}

export const DAILY_READING_WEBSITES: ReadingResource[] = [
  { id: 'daily-dev', name: 'daily.dev', url: 'https://daily.dev/', role: 'Daily developer feed (08:00–08:20 PM)' },
  { id: 'hacker-news', name: 'Hacker News', url: 'https://news.ycombinator.com/', role: 'Engineering & startup discussions (08:20–08:30 PM)' },
  { id: 'github-trending', name: 'GitHub Trending', url: 'https://github.com/trending/', role: 'Open-source repositories & tools (08:45–08:55 PM)' },
  { id: 'roadmap-sh', name: 'roadmap.sh', url: 'https://roadmap.sh/', role: 'Structured role & skill roadmaps' },
  { id: 'hf-learn', name: 'Hugging Face Learn', url: 'https://huggingface.co/learn', role: 'NLP, LLMs, and AI engineering courses' },
];
