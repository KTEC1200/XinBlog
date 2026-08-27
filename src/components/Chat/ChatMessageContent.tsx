import { Children, memo, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Link, alpha, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Components } from 'react-markdown';
import type { SxProps, Theme } from '@mui/material/styles';
import { ImageLightbox } from '@/components/Common/ImageLightbox';
import { buildChatMediaUrl } from '@/api/chat';




const BLOCKED_TAGS = new Set([
  'input',
  'iframe',
  'video',
  'audio',
  'table',
  'tbody',
  'thead',
  'tfoot',
  'tr',
  'td',
  'th',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'details',
  'summary',
]);




const DEFAULT_PROTOCOLS = (defaultSchema.protocols?.href as readonly string[] | undefined) || [];

const chatSchema = {
  ...defaultSchema,
  tagNames: (defaultSchema.tagNames as string[]).filter((t) => !BLOCKED_TAGS.has(t)),
  protocols: {
    ...((defaultSchema.protocols as Record<string, string[]>) || {}),
    href: [...DEFAULT_PROTOCOLS, 'cite'],
    src: [
      ...((defaultSchema.protocols as Record<string, string[]>)?.src || ['http', 'https']),
      'chat-media',
    ],
  },
};

interface ChatMessageContentProps {
  content: string;
  
  roomKey: string;
  
  imageSx?: SxProps<Theme>;
  
  onReplyQuoteClick?: (timestamp: number) => void;
}


function findCiteTs(children: ReactNode): number | null {
  let found: number | null = null;
  Children.forEach(children, (child) => {
    if (found !== null || !Object.prototype.hasOwnProperty.call(child, 'props')) return;
    const props = (child as { props?: Record<string, unknown> }).props ?? {};
    let href = typeof props.href === 'string' ? props.href : undefined;
    if (!href) {
      const node = props.node as { properties?: Record<string, unknown> } | undefined;
      href = typeof node?.properties?.href === 'string' ? node.properties.href : undefined;
    }
    if (typeof href === 'string' && href.startsWith('cite:')) {
      found = Number(href.slice(5));
      return;
    }
    if (props.children !== undefined) {
      const nested = findCiteTs(props.children as ReactNode);
      if (nested !== null) found = nested;
    }
  });
  return found;
}

type HastNode = {
  properties?: { href?: unknown };
  children?: HastNode[];
};


function findCiteTsInNode(node: HastNode | undefined | null): number | null {
  if (!node || typeof node !== 'object') return null;
  const { properties, children: subs } = node;
  const href = properties?.href;
  if (typeof href === 'string' && href.startsWith('cite:')) {
    return Number(href.slice(5));
  }
  if (Array.isArray(subs)) {
    for (const child of subs) {
      const ts = findCiteTsInNode(child);
      if (ts !== null) return ts;
    }
  }
  return null;
}

const MEDIA_RE = /^chat-media:\/\/(.+)$/;


function ChatImage({ src, alt, onOpen, imageSx }: { src: string; alt: string; onOpen: () => void; imageSx?: SxProps<Theme> }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <Box sx={{ position: 'relative', width: 'fit-content', maxWidth: '100%', m: '0.25em 0' }}>
      {!loaded && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
            bgcolor: (t) => alpha(t.palette.text.primary, 0.04),
          }}
        >
          <CircularProgress size={24} thickness={5} />
        </Box>

      )}
      <Box
        component="img"
        src={src}
        alt={alt || '图片'}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onClick={loaded ? onOpen : undefined}
        sx={{
          position: 'relative',
          display: 'block',
          maxWidth: '100%',
          maxHeight: 320,
          objectFit: 'contain',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          cursor: loaded ? 'zoom-in' : 'wait',
          opacity: loaded ? 1 : 0,
          transition: 'opacity .25s ease',
          ...imageSx,
        }}
      />
    </Box>

  );
}

function ChatMessageContent({ content, roomKey, imageSx, onReplyQuoteClick }: ChatMessageContentProps) {
  
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const components: Components = {
    
    
    img({ src, alt }) {
      let url = src as string | undefined;
      const m = typeof url === 'string' ? url.match(MEDIA_RE) : null;
      if (m) url = buildChatMediaUrl(roomKey, m[1]);
      if (!url) return null;
      return <ChatImage src={url} alt={alt || '图片'} onOpen={() => setLightboxSrc(url)} imageSx={imageSx} />;
    },
    
    
    a({ href, children }) {
      const { palette } = useTheme();
      if (typeof href === 'string' && href.startsWith('cite:')) {
        return <span style={{ color: palette.primary.main }}>{children}</span>;

      }
      const safeHref = href && /^(https?:\/\/|mailto:)/i.test(href);
      if (!safeHref) {
        return <span>{children}</span>;

      }
      return (
        <Link href={href} target="_blank" rel="nofollow noopener noreferrer" underline="hover">
          {children}
        </Link>

      );
    },
    
    
    blockquote({ children, node }) {
      const theme = useTheme();
      const { palette } = theme;
      const r = theme.shape.borderRadius;
      
      const citeTs = findCiteTsInNode(node as HastNode | undefined) ?? findCiteTs(children);
      const baseSx = {
        m: '0 0 0.6em 0',
        p: '0.3em 0.7em',
        borderLeft: `3px solid ${alpha(palette.primary.main, 0.55)}`,
        bgcolor: alpha(palette.primary.main, 0.06),
        borderRadius: `0 ${Math.max(4, r)}px ${Math.max(4, r)}px 0`,
        color: alpha(palette.text.primary, 0.62),
      };
      if (citeTs === null) {
        return (
          <Box component="blockquote" sx={baseSx}>
            {children}
          </Box>

        );
      }
      return (
        <Box
          component="blockquote"
          onClick={() => onReplyQuoteClick?.(citeTs)}
          sx={{
            ...baseSx,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            transition: 'background-color 0.15s ease',
            '&:hover': { bgcolor: alpha(palette.primary.main, 0.12) },
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>

          <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: palette.primary.main }}>
            <ArrowUpwardIcon sx={{ fontSize: 16 }} />
          </Box>

        </Box>

      );
    },
    code(props) {
      const { palette } = useTheme();
      const { children } = props;
      
      const inline = Boolean((props as unknown as { inline?: boolean }).inline);
      if (inline) {
        return (
          <code
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              fontSize: '0.85em',
              padding: '0.15em 0.4em',
              borderRadius: 4,
              backgroundColor: alpha(palette.text.primary, 0.08),
              color: palette.text.primary,
            }}
          >
            {children}
          </code>

        );
      }
      return (
        <code
          style={{
            display: 'block',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            fontSize: '0.85em',
            padding: '0.8em 1em',
            borderRadius: 8,
            backgroundColor: alpha(palette.text.primary, 0.06),
            whiteSpace: 'pre',
            overflowX: 'auto',
          }}
        >
          {children}
        </code>

      );
    },
  };

  return (
    <Box
      sx={{
        
        '& > :first-of-type': { mt: 0 },
        '& > :last-child': { mb: 0 },
        '& p': { m: '0.25em 0', fontSize: 'inherit', lineHeight: 'inherit' },
        '& ul, & ol': { m: '0.25em 0', pl: '1.4em' },
        '& li': { m: '0.1em 0' },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[[rehypeSanitize, chatSchema] as never]}
        urlTransform={(url) => {
          
          
          if (/^(chat-media|cite):/i.test(url)) return url;
          return defaultUrlTransform(url);
        }}
        components={components}
      >
        {content}
      </ReactMarkdown>


      <ImageLightbox open={Boolean(lightboxSrc)} src={lightboxSrc || ''} alt="图片" onClose={() => setLightboxSrc(null)} />
    </Box>

  );
}




export default memo(ChatMessageContent);