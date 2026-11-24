export interface YoutubeDayRotation {
  dayOfWeek: number;
  dayName: string;
  channel: string;
  channelUrl: string;
  topic: string;
}

export const YOUTUBE_ROTATION: YoutubeDayRotation[] = [
  {
    dayOfWeek: 1,
    dayName: 'Monday',
    channel: 'Matt Wolfe',
    channelUrl: 'https://www.youtube.com/@mreflow',
    topic: 'AI, LLMs, AI agents and new models',
  },
  {
    dayOfWeek: 2,
    dayName: 'Tuesday',
    channel: 'Fireship',
    channelUrl: 'https://www.youtube.com/@Fireship',
    topic: 'Programming languages, frameworks and developer tools',
  },
  {
    dayOfWeek: 3,
    dayName: 'Wednesday',
    channel: 'TechLinked',
    channelUrl: 'https://www.youtube.com/@TechLinked',
    topic: 'Global technology news, startups and Big Tech',
  },
  {
    dayOfWeek: 4,
    dayName: 'Thursday',
    channel: 'AI Explained',
    channelUrl: 'https://www.youtube.com/@AIExplained-official',
    topic: 'AI research and machine learning breakthroughs',
  },
  {
    dayOfWeek: 5,
    dayName: 'Friday',
    channel: 'ByteByteGo',
    channelUrl: 'https://www.youtube.com/@ByteByteGo',
    topic: 'System design, architecture and scalability',
  },
  {
    dayOfWeek: 6,
    dayName: 'Saturday',
    channel: 'Hussein Nasser',
    channelUrl: 'https://www.youtube.com/@hnasr',
    topic: 'Backend, databases, networking and DevOps',
  },
  {
    dayOfWeek: 0,
    dayName: 'Sunday',
    channel: 'Two Minute Papers',
    channelUrl: 'https://www.youtube.com/@TwoMinutePapers',
    topic: 'Robotics, research and emerging technologies',
  },
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
  { id: 'daily-dev', name: 'daily.dev', url: 'https://daily.dev/', role: 'Primary daily developer-news feed (08:00–08:20 PM)' },
  { id: 'hacker-news', name: 'Hacker News', url: 'https://news.ycombinator.com/', role: 'Developer discussions & tech stories (08:20–08:30 PM)' },
  { id: 'github-trending', name: 'GitHub Trending', url: 'https://github.com/trending', role: 'New open-source projects & tools (08:45–08:55 PM)' },
  { id: 'roadmap-sh', name: 'roadmap.sh', url: 'https://roadmap.sh/', role: 'Structured technology roadmaps' },
  { id: 'hf-learn', name: 'Hugging Face Learn', url: 'https://huggingface.co/learn', role: 'AI and ML learning resources' },
];

export interface BlockQuickLink {
  label: string;
  url: string;
}

export function getQuickLinksForScheduleBlock(
  title: string,
  dayOfWeek: number
): BlockQuickLink[] {
  const lower = title.toLowerCase();

  if (lower.includes('daily.dev')) {
    return [{ label: 'daily.dev', url: 'https://daily.dev/' }];
  }
  if (lower.includes('hacker news')) {
    return [{ label: 'Hacker News', url: 'https://news.ycombinator.com/' }];
  }
  if (lower.includes('github trending')) {
    return [{ label: 'GitHub Trending', url: 'https://github.com/trending' }];
  }

  for (const yt of YOUTUBE_ROTATION) {
    if (lower.includes(yt.channel.toLowerCase())) {
      return [{ label: yt.channel, url: yt.channelUrl }];
    }
  }
  if (lower.includes('youtube')) {
    const yt = getYoutubeChannelForDay(dayOfWeek);
    return [{ label: yt.channel, url: yt.channelUrl }];
  }

  if (lower.includes('dsa')) {
    return [
      { label: 'takeUforward', url: 'https://www.youtube.com/@takeUforward' },
      { label: 'LeetCode', url: 'https://leetcode.com/' },
      { label: 'NeetCode', url: 'https://neetcode.io/roadmap' },
    ];
  }

  if (lower.includes('software engineering')) {
    return [{ label: 'roadmap.sh', url: 'https://roadmap.sh/' }];
  }

  return [];
}
