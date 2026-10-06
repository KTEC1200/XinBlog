import { forwardRef } from 'react';
import { Box, Chip, Container, Skeleton, Typography, alpha } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { HeroConfig } from '@/types';


export const HeroFullscreen = forwardRef<HTMLDivElement, { hero?: HeroConfig; bgLoaded?: boolean }>(
  function HeroFullscreen({ hero, bgLoaded }, ref) {
    const hasBg = Boolean(hero?.backgroundImage);

    return (
      <Box
        ref={ref}
        sx={{
          position: 'relative',
          
          minHeight: { xs: '100dvh', md: '100dvh' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: 0,
          bgcolor: 'transparent',
        }}
      >
        {}
        {hasBg && (
          <>
            {!bgLoaded && (
              <Skeleton
                variant="rectangular"
                sx={{ position: 'absolute', inset: 0, zIndex: 0, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06) }}
              />
            )}
            <Box
              component="img"
              src={hero?.backgroundImage}
              alt=""
              onLoad={() => bgLoaded !== undefined && (bgLoaded as boolean)}
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                zIndex: 0,
                userSelect: 'none',
              }}
            />
            {}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                background: (theme) =>
                  theme.palette.mode === 'light'
                    ? `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.45)} 0%, ${alpha(theme.palette.background.default, 0.25)} 45%, ${alpha(theme.palette.background.default, 0.55)} 100%)`
                    : `linear-gradient(180deg, ${alpha(theme.palette.common.black, 0.55)} 0%, ${alpha(theme.palette.common.black, 0.3)} 45%, ${alpha(theme.palette.common.black, 0.65)} 100%)`,
              }}
            />
          </>

        )}

        {}
        <Container
          maxWidth="lg"
          sx={{ position: 'relative', zIndex: 2, width: '100%', textAlign: 'center', pb: { xs: 12, md: 14 } }}
        >
          <Box sx={{ maxWidth: 720, mx: 'auto' }}>
            {hero?.badge && (
              <Chip
                label={hero.badge}
                sx={{
                  mb: 3,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.7 : 0.2),
                  color: 'primary.main',
                  fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                }}
              />
            )}
            {hero?.title && (
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  fontSize: { xs: '2rem', sm: '3rem', md: '3.75rem' },
                  overflowWrap: 'break-word',
                  color: '#fff',
                  textShadow: '0 2px 18px rgba(0,0,0,0.55)',
                }}
              >
                {hero.title}
              </Typography>

            )}
            {hero?.subtitle && (
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 400,
                  lineHeight: 1.6,
                  mb: 4,
                  fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                  overflowWrap: 'break-word',
                  color: 'rgba(255,255,255,0.92)',
                  textShadow: '0 2px 14px rgba(0,0,0,0.5)',
                }}
              >
                {hero.subtitle}
              </Typography>

            )}
          </Box>

        </Container>


        {}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: { xs: 24, md: 32 },
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: '50%',
            color: '#fff',
            bgcolor: alpha('#000000', 0.28),
            border: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.45)}`,
            backdropFilter: 'blur(6px)',
            animation: 'heroFullscreenBounce 1.8s ease-in-out infinite',
            '@keyframes heroFullscreenBounce': {
              '0%, 100%': { transform: 'translateX(-50%) translateY(0)' },
              '50%': { transform: 'translateX(-50%) translateY(8px)' },
            },
            '& svg': { fontSize: 28 },
          }}
        >
          <ExpandMoreIcon />
        </Box>

      </Box>

    );
  }
);