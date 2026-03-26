import { Sparkles, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';

interface LandingPageProps {
  onGetStarted: () => void;
}

/* ── tiny SVG tech logos (inline to avoid extra assets) ── */
const AwsLogo = () => (
  <svg viewBox="0 0 80 48" className="h-8 opacity-80 hover:opacity-100 transition-opacity">
    <text x="0" y="36" fontFamily="system-ui" fontSize="28" fontWeight="700" fill="#232f3ecf">AWS</text>
  </svg>
);
const ReactLogo = () => (
  <svg viewBox="0 0 100 48" className="h-8 opacity-80 hover:opacity-100 transition-opacity">
    <text x="0" y="36" fontFamily="system-ui" fontSize="24" fontWeight="700" fill="#61DAFB">React</text>
  </svg>
);
const TailwindLogo = () => (
  <svg viewBox="0 0 120 48" className="h-8 opacity-80 hover:opacity-100 transition-opacity">
    <text x="0" y="36" fontFamily="system-ui" fontSize="22" fontWeight="700" fill="#06B6D4">Tailwind</text>
  </svg>
);
const TypeScriptLogo = () => (
  <svg viewBox="0 0 130 48" className="h-8 opacity-80 hover:opacity-100 transition-opacity">
    <text x="0" y="36" fontFamily="system-ui" fontSize="22" fontWeight="700" fill="#3178C6">TypeScript</text>
  </svg>
);
const ViteLogo = () => (
  <svg viewBox="0 0 60 48" className="h-8 opacity-80 hover:opacity-100 transition-opacity">
    <text x="0" y="36" fontFamily="system-ui" fontSize="24" fontWeight="700" fill="#646CFF">Vite</text>
  </svg>
);
const DeepSeekLogo = () => (
  <svg viewBox="0 0 130 48" className="h-8 opacity-80 hover:opacity-100 transition-opacity">
    <text x="0" y="36" fontFamily="system-ui" fontSize="22" fontWeight="700" fill="#4A6CF7">DeepSeek</text>
  </svg>
);
const GeminiLogo = () => (
  <svg viewBox="0 0 110 48" className="h-8 opacity-80 hover:opacity-100 transition-opacity">
    <text x="0" y="36" fontFamily="system-ui" fontSize="22" fontWeight="700" fill="#8E75B2">Gemini</text>
  </svg>
);

const FEATURES = [
  {
    title: 'Real-Time Streaming',
    description: 'Watch your optimized prompt appear word-by-word via Lambda Response Streaming. No waiting for the full response — results flow instantly.',
  },
  {
    title: 'Web + Extension Sync',
    description: 'Optimize on the web app or highlight text on any site with the Chrome extension. Your history and templates sync across both via Cognito auth.',
  },
  {
    title: 'Built-in Chat Assistant',
    description: 'Refine prompts conversationally. Ask follow-up questions, explore alternatives, and iterate — all with streaming responses powered by DeepSeek & Gemini.',
  },
  {
    title: '4 Optimization Modes',
    description: 'Precision tightens wording, Exploratory rewrites creatively, Structured adds markdown formatting, and Multilingual adapts your prompt across languages.',
  },
  {
    title: 'Prompt History & Templates',
    description: 'Every optimization is saved automatically. Browse your history, save favorites as reusable templates, and share them with the community.',
  },
  {
    title: 'Serverless & Fast',
    description: 'Powered by AWS Lambda, API Gateway, DynamoDB, and CloudFront. Zero cold-start overhead with provisioned throughput — responses in under 2 seconds.',
  },
];

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <>
      <SEO
        title="Proptimizer — AI-Powered Prompt Engineering"
        description="Engineer smarter prompts for Claude, ChatGPT & Gemini. Optimize your AI interactions with precision — faster results, better outputs."
      />
      <div className="min-h-screen bg-[#fafafa]">

      {/* ─── Navbar ─── */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src="/proptimizer-logo.svg" alt="Proptimizer Logo" className="h-9 w-auto" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#64ffda] via-[#00bcd4] to-[#6366f1] bg-clip-text text-transparent animate-gradient-text bg-[length:300%_300%]">
                  Proptimizer
                </h1>
                <p className="text-[10px] text-gray-400 -mt-0.5 tracking-wide">AI Prompt Engineering</p>
              </div>
            </div>
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-[#00bcd4] to-[#6366f1] text-white font-semibold px-5 py-2 rounded-lg text-sm hover:shadow-lg hover:scale-[1.02] transition-all flex items-center space-x-1.5"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/60 via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center cursor-default">
          {/* Badge */}
          <div className="inline-flex items-center space-x-1.5 bg-white border border-gray-200 text-gray-600 px-3.5 py-1.5 rounded-full text-xs font-medium mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#00bcd4]" />  
            <span>Powered by AWS</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-[4.25rem] font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight">
            Master the Art of
            <br />
            <span className="bg-gradient-to-r from-[#64ffda] via-[#00bcd4] to-[#6366f1] bg-clip-text text-transparent animate-gradient-text bg-[length:300%_300%]">
              Prompt Engineering
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Transform vague ideas into precise AI instructions. Choose from 4 optimization modes, 
            chat with AI in real time, and sync everything across web and Chrome extension.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-[#00bcd4] to-[#6366f1] text-white font-semibold px-7 py-3.5 rounded-xl hover:shadow-lg hover:shadow-cyan-200 hover:scale-[1.02] transition-all flex items-center space-x-2"
            >
              {/* <Sparkles className="w-4 h-4" /> */}
              <span>Start Optimizing Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <a
              href="https://chromewebstore.google.com/detail/proptimizer/fgnjfohkickjglglihmaojajigpnccbe"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-chromium w-5 h-5" aria-hidden="true"><path d="M10.88 21.94 15.46 14"></path><path d="M21.17 8H12"></path><path d="M3.95 6.06 8.54 14"></path><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle></svg>
              <span>Install Extension</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 cursor-default">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Why <span className="bg-gradient-to-r from-[#64ffda] via-[#00bcd4] to-[#6366f1] bg-clip-text text-transparent animate-gradient-text bg-[length:300%_300%]">Proptimizer?</span>
          </h2>
          <p className="text-base text-gray-500 max-w-xl mx-auto">
            Built for developers and professionals who demand precision from their AI interactions
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 cursor-default">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 hover:shadow-md transition-all duration-200 group"
            >
              <h3 className="text-base cursor-default font-semibold text-gray-900 mb-2 group-hover:text-[#00bcd4] transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm cursor-default text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-100 bg-white cursor-default">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Tech Stack Logos */}
          <div className="flex flex-col items-center mb-8">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Built with</p>
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3">
              <AwsLogo />
              <ReactLogo />
              <TypeScriptLogo />
              <TailwindLogo />
              <ViteLogo />
              <DeepSeekLogo />
              <GeminiLogo />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo & Name */}
            <div className="flex items-center space-x-2.5">
              <img src="/proptimizer-logo.svg" alt="Proptimizer" className="h-7 w-auto" />
              <span className="font-semibold bg-gradient-to-r from-[#64ffda] via-[#00bcd4] to-[#6366f1] bg-clip-text text-transparent animate-gradient-text bg-[length:300%_300%]">
                Proptimizer
              </span>
            </div>

            {/* Copyright */}
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Proptimizer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      </div>
    </>
  );
}