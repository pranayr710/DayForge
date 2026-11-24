import type { ScheduleCategory, ScheduleTemplate } from '@/types';
import { DEFAULT_USER_ID } from './personalPlan';
import { getYoutubeChannelForDay } from './awareness';

interface RoutineBlockInput {
  startTime: string;
  endTime: string;
  title: string;
  category: ScheduleCategory;
  subtitle?: string;
}

function monTueFriBlocks(dayOfWeek: number): RoutineBlockInput[] {
  const yt = getYoutubeChannelForDay(dayOfWeek);
  return [
    { startTime: '16:35', endTime: '17:30', title: 'Travel, refresh and rest', category: 'break' },
    { startTime: '17:30', endTime: '18:30', title: 'College work', category: 'routine' },
    { startTime: '18:30', endTime: '19:30', title: 'DSA – Java', category: 'dsa', subtitle: '15m revision · 35m solve · 10m review' },
    { startTime: '19:30', endTime: '20:00', title: 'Dinner', category: 'break' },
    { startTime: '20:00', endTime: '20:20', title: 'daily.dev', category: 'awareness' },
    { startTime: '20:20', endTime: '20:30', title: 'Hacker News', category: 'awareness' },
    { startTime: '20:30', endTime: '20:45', title: `YouTube: ${yt.channel}`, category: 'awareness', subtitle: yt.topic },
    { startTime: '20:45', endTime: '20:55', title: 'GitHub Trending', category: 'awareness' },
    { startTime: '20:55', endTime: '21:00', title: 'Technology notes', category: 'awareness' },
    { startTime: '21:00', endTime: '21:45', title: "Apply the day's learning", category: 'routine' },
    { startTime: '21:45', endTime: '22:30', title: 'Placement preparation', category: 'placement' },
    { startTime: '22:30', endTime: '23:00', title: "Master's / international internships", category: 'career' },
    { startTime: '23:00', endTime: '23:30', title: 'Project / revision / buffer', category: 'project' },
    { startTime: '23:30', endTime: '00:15', title: 'Personal time and wind-down', category: 'personal' },
    { startTime: '00:15', endTime: '00:30', title: 'Sleep', category: 'personal' },
  ];
}

const WEDNESDAY_BLOCKS: RoutineBlockInput[] = [
  { startTime: '15:45', endTime: '17:00', title: 'Travel, refresh and rest', category: 'break' },
  { startTime: '17:00', endTime: '18:00', title: 'College work', category: 'routine' },
  { startTime: '18:00', endTime: '19:00', title: 'DSA – Java', category: 'dsa', subtitle: '15m revision · 35m solve · 10m review' },
  { startTime: '19:00', endTime: '19:30', title: 'Break / personal time', category: 'break' },
  { startTime: '19:30', endTime: '20:00', title: 'Dinner', category: 'break' },
  { startTime: '20:00', endTime: '20:20', title: 'daily.dev', category: 'awareness' },
  { startTime: '20:20', endTime: '20:30', title: 'Hacker News', category: 'awareness' },
  { startTime: '20:30', endTime: '20:45', title: 'TechLinked', category: 'awareness', subtitle: 'Global technology news, startups, Big Tech' },
  { startTime: '20:45', endTime: '20:55', title: 'GitHub Trending', category: 'awareness' },
  { startTime: '20:55', endTime: '21:00', title: 'Technology notes', category: 'awareness' },
  { startTime: '21:00', endTime: '21:45', title: "Apply the day's learning", category: 'routine' },
  { startTime: '21:45', endTime: '22:30', title: 'Operating Systems preparation', category: 'placement' },
  { startTime: '22:30', endTime: '23:00', title: "Master's / international internships", category: 'career' },
  { startTime: '23:00', endTime: '23:30', title: 'Project / revision / buffer', category: 'project' },
  { startTime: '23:30', endTime: '00:15', title: 'Wind-down', category: 'personal' },
  { startTime: '00:15', endTime: '00:30', title: 'Sleep', category: 'personal' },
];

const THURSDAY_BLOCKS: RoutineBlockInput[] = [
  { startTime: '13:15', endTime: '14:05', title: 'Lunch', category: 'break' },
  { startTime: '14:05', endTime: '14:30', title: 'Rest', category: 'break' },
  { startTime: '14:30', endTime: '15:30', title: 'DSA – Java', category: 'dsa', subtitle: '15m revision · 35m solve · 10m review' },
  { startTime: '15:30', endTime: '16:30', title: 'Project development', category: 'project' },
  { startTime: '16:30', endTime: '17:15', title: 'College work', category: 'routine' },
  { startTime: '17:15', endTime: '18:00', title: 'College work / practical learning', category: 'routine' },
  { startTime: '18:00', endTime: '18:30', title: 'Break', category: 'break' },
  { startTime: '18:30', endTime: '19:15', title: 'Computer Networks preparation', category: 'placement' },
  { startTime: '19:15', endTime: '19:30', title: 'Break', category: 'break' },
  { startTime: '19:30', endTime: '20:00', title: 'Dinner', category: 'break' },
  { startTime: '20:00', endTime: '20:20', title: 'daily.dev', category: 'awareness' },
  { startTime: '20:20', endTime: '20:30', title: 'Hacker News', category: 'awareness' },
  { startTime: '20:30', endTime: '20:45', title: 'AI Explained', category: 'awareness', subtitle: 'AI research and ML breakthroughs' },
  { startTime: '20:45', endTime: '20:55', title: 'GitHub Trending', category: 'awareness' },
  { startTime: '20:55', endTime: '21:00', title: 'Technology notes', category: 'awareness' },
  { startTime: '21:00', endTime: '21:30', title: "Master's / international internships", category: 'career' },
  { startTime: '21:30', endTime: '22:30', title: 'Project development', category: 'project' },
  { startTime: '22:30', endTime: '23:00', title: 'Application tracking', category: 'career' },
  { startTime: '23:00', endTime: '23:30', title: 'Revision / buffer', category: 'routine' },
  { startTime: '23:30', endTime: '00:15', title: 'Wind-down', category: 'personal' },
  { startTime: '00:15', endTime: '00:30', title: 'Sleep', category: 'personal' },
];

const SATURDAY_BLOCKS: RoutineBlockInput[] = [
  { startTime: '09:00', endTime: '10:00', title: 'DSA', category: 'dsa' },
  { startTime: '10:00', endTime: '11:30', title: 'Project development', category: 'project' },
  { startTime: '11:30', endTime: '12:30', title: 'Software engineering curriculum', category: 'routine' },
  { startTime: '12:30', endTime: '13:15', title: 'College work', category: 'routine' },
  { startTime: '13:15', endTime: '14:05', title: 'Lunch', category: 'break' },
  { startTime: '14:05', endTime: '15:05', title: 'Placement mock test', category: 'placement' },
  { startTime: '15:05', endTime: '15:30', title: 'Break', category: 'break' },
  { startTime: '15:30', endTime: '16:30', title: 'Core CS preparation', category: 'placement' },
  { startTime: '16:30', endTime: '17:30', title: 'International internships', category: 'career' },
  { startTime: '17:30', endTime: '19:30', title: 'Personal time', category: 'personal' },
  { startTime: '19:30', endTime: '20:00', title: 'Dinner', category: 'break' },
  { startTime: '20:00', endTime: '20:20', title: 'daily.dev', category: 'awareness' },
  { startTime: '20:20', endTime: '20:30', title: 'Hacker News', category: 'awareness' },
  { startTime: '20:30', endTime: '20:45', title: 'Hussein Nasser', category: 'awareness', subtitle: 'Backend, databases, networking, DevOps' },
  { startTime: '20:45', endTime: '20:55', title: 'GitHub Trending', category: 'awareness' },
  { startTime: '20:55', endTime: '21:00', title: 'Technology notes', category: 'awareness' },
  { startTime: '21:00', endTime: '21:30', title: 'Technical revision', category: 'routine' },
  { startTime: '21:30', endTime: '23:30', title: 'Free time', category: 'personal' },
];

const SUNDAY_BLOCKS: RoutineBlockInput[] = [
  { startTime: '09:00', endTime: '10:00', title: 'DSA revision', category: 'dsa' },
  { startTime: '10:00', endTime: '11:00', title: 'Software engineering revision', category: 'routine' },
  { startTime: '11:00', endTime: '12:00', title: 'Project development', category: 'project' },
  { startTime: '12:00', endTime: '13:00', title: 'College work', category: 'routine' },
  { startTime: '13:15', endTime: '14:05', title: 'Lunch', category: 'break' },
  { startTime: '14:05', endTime: '15:00', title: 'IELTS / TOEFL preparation', category: 'career' },
  { startTime: '15:00', endTime: '16:00', title: "US Master's research", category: 'career' },
  { startTime: '16:00', endTime: '16:30', title: 'Break', category: 'break' },
  { startTime: '16:30', endTime: '17:30', title: 'Interview preparation', category: 'placement' },
  { startTime: '17:30', endTime: '18:00', title: 'Weekly review', category: 'routine' },
  { startTime: '18:00', endTime: '19:30', title: 'Personal time', category: 'personal' },
  { startTime: '19:30', endTime: '20:00', title: 'Dinner', category: 'break' },
  { startTime: '20:00', endTime: '20:20', title: 'daily.dev', category: 'awareness' },
  { startTime: '20:20', endTime: '20:30', title: 'Hacker News', category: 'awareness' },
  { startTime: '20:30', endTime: '20:45', title: 'Two Minute Papers', category: 'awareness', subtitle: 'Robotics, research, emerging technologies' },
  { startTime: '20:45', endTime: '20:55', title: 'GitHub Trending', category: 'awareness' },
  { startTime: '20:55', endTime: '21:00', title: 'Technology notes', category: 'awareness' },
  { startTime: '21:00', endTime: '23:00', title: 'Relax and prepare for Monday', category: 'personal' },
];

export function createDefaultRoutineTemplates(nowIso: string): ScheduleTemplate[] {
  const byDay: Record<number, RoutineBlockInput[]> = {
    0: SUNDAY_BLOCKS,
    1: monTueFriBlocks(1),
    2: monTueFriBlocks(2),
    3: WEDNESDAY_BLOCKS,
    4: THURSDAY_BLOCKS,
    5: monTueFriBlocks(5),
    6: SATURDAY_BLOCKS,
  };

  const templates: ScheduleTemplate[] = [];
  for (const [dayStr, blocks] of Object.entries(byDay)) {
    const dayOfWeek = Number(dayStr);
    blocks.forEach((b, idx) => {
      templates.push({
        id: `routine-${dayOfWeek}-${idx + 1}`,
        userId: DEFAULT_USER_ID,
        source: 'routine',
        category: b.category,
        dayOfWeek,
        title: b.title,
        subtitle: b.subtitle,
        startTime: b.startTime,
        endTime: b.endTime,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    });
  }
  return templates;
}
