import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://d3jqm7so635aqb.cloudfront.net';
const OG_IMAGE = `${SITE_URL}/og-image.png`;

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export default function SEO({
  title = 'Proptimizer — AI-Powered Prompt Engineering',
  description = 'Engineer smarter prompts for Claude, ChatGPT & Gemini. Proptimizer optimizes your AI interactions with precision — faster results, better outputs.',
  image = OG_IMAGE,
  url = SITE_URL,
  type = 'website',
}: SEOProps) {
  const fullTitle = title.includes('Proptimizer') ? title : `${title} | Proptimizer`;
  const fullImageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="Proptimizer, AI prompt engineering, prompt optimizer, Claude, ChatGPT, Gemini, AI assistant, prompt templates" />
      <meta name="author" content="Proptimizer" />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook / Zalo / LinkedIn */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Proptimizer" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:secure_url" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Proptimizer — AI-Powered Prompt Engineering Platform" />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content="Proptimizer — AI-Powered Prompt Engineering Platform" />

      {/* Theme */}
      <meta name="theme-color" content="#0a0e1a" />
    </Helmet>
  );
}
