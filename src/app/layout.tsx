import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '无尽之书 · AI 文本冒险',
    template: '%s | 无尽之书',
  },
  description:
    '一款由大语言模型驱动的 AI 文本冒险游戏：用自然语言与世界互动，剧情、位置、物品与人物关系随你的选择无限延伸。',
  keywords: ['AI 文本冒险', '互动小说', '文字冒险', 'DeepSeek', 'AI 游戏'],
  authors: [{ name: 'Endless Book' }],
  // icons: {
  //   icon: '',
  // },
  openGraph: {
    title: '扣子编程 | 你的 AI 工程师已就位',
    description:
      '我正在使用扣子编程 Vibe Coding，让创意瞬间上线。告别拖拽，拥抱心流。',
    url: 'https://code.coze.cn',
    siteName: '扣子编程',
    locale: 'zh_CN',
    type: 'website',
    // images: [
    //   {
    //     url: '',
    //     width: 1200,
    //     height: 630,
    //     alt: '扣子编程 - 你的 AI 工程师',
    //   },
    // ],
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'Coze Code | Your AI Engineer is Here',
  //   description:
  //     'Build and deploy full-stack applications through AI conversation. No env setup, just flow.',
  //   // images: [''],
  // },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="bg-[#F5F5F7] antialiased">
        {children}
      </body>
    </html>
  );
}
