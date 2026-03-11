# Uputstvo za deploy

## Hero video (hero-srbija.mp4)

Video **SRBIJA TRAILER.mp4** (1:19, ~188MB) je prevelik za GitHub (limit 100MB), pa je u `.gitignore`.

### Opcije za produkciju

1. **Kompresija** – Smanji video na &lt;100MB (npr. FFmpeg), preimenuj u `hero-srbija.mp4`, ukloni iz `.gitignore` i commit-uj.
2. **Eksterni hosting** – Hostuj video na CDN/Supabase/Vimeo i zameni `src` u `HeroSection.tsx` i `layout.tsx`.
3. **Ručno** – Nakon deploy-a, upload-uj `hero-srbija.mp4` u `public/` na serveru (ako imaš pristup).
