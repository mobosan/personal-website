type DemoBase = {
  slug: string;
  title: string;
  description: string;
  category: string;
  cover: string;
  stack: string[];
};
export type Demo = DemoBase &
  (
    | { type: 'component'; component: 'particles'; status: '可体验' }
    | { type: 'static'; url: string; status: '可体验' }
    | { type: 'api'; endpoint?: string; status: '规划中' }
  );
export const demos: Demo[] = [
  {
    slug: 'particle-field',
    title: '交互式粒子场',
    description: '移动指针，拨动一个微小的宇宙。探索粒子、距离与连接之间的关系。',
    category: '创意编程',
    cover: '/images/particles.svg',
    stack: ['Canvas', 'React', 'TypeScript'],
    type: 'component',
    component: 'particles',
    status: '可体验',
  },
  {
    slug: 'color-studio',
    title: '渐变配色工作台',
    description: '从两种颜色开始，调出属于你的渐变。实时预览，并复制 CSS 到你的项目。',
    category: '实用工具',
    cover: '/images/gradient.svg',
    stack: ['HTML', 'CSS', 'JavaScript'],
    type: 'static',
    url: '/demos/color-studio/index.html',
    status: '可体验',
  },
  {
    slug: 'agent-playground',
    title: 'AI Agent 沙盒',
    description: '探索工具调用与任务编排的交互方式。后端接入规划，当前暂不可运行。',
    category: 'AI 实验',
    cover: '/images/agent.svg',
    stack: ['API', 'AI Agent'],
    type: 'api',
    status: '规划中',
  },
];
