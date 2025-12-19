const fs = require('fs');
const https = require('https');

const data = JSON.parse(fs.readFileSync('sponsors.json', 'utf8'));

function fetchImage(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        https.get(url, options, (res) => {
            // Handle redirects
            if (res.statusCode === 301 || res.statusCode === 302) {
                return fetchImage(res.headers.location).then(resolve).catch(reject);
            }

            if (res.statusCode !== 200) {
                console.error(`Failed to fetch ${url}: ${res.statusCode}`);
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }

            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const base64 = buffer.toString('base64');
                const contentType = res.headers['content-type'] || 'image/png';
                resolve(`data:${contentType};base64,${base64}`);
            });
        }).on('error', reject);
    });
}

async function generateSVG(sponsors) {
    const avatarSize = 60;
    const spacing = 10;
    const columns = 6;
    const padding = 20;

    const rows = Math.ceil(sponsors.length / columns);
    const width = (avatarSize + spacing) * columns + padding * 2 - spacing;
    const headerHeight = 40;
    const height = headerHeight + (avatarSize + spacing + 20) * rows + padding;

    let clipPaths = '';
    let content = '';
    let avatarStyles = '';

    // Fetch all images and convert to base64
    for (let i = 0; i < sponsors.length; i++) {
        const sponsor = sponsors[i];
        const col = i % columns;
        const row = Math.floor(i / columns);
        const x = padding + col * (avatarSize + spacing);
        const y = headerHeight + padding + row * (avatarSize + spacing + 20);
        const centerX = x + avatarSize / 2;
        const centerY = y + avatarSize / 2;

        let avatarUrl;
        if (sponsor.github) {
            avatarUrl = `https://avatars.githubusercontent.com/${sponsor.github}?size=128`;
        } else {
            avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(sponsor.name)}&background=random&size=128&format=png`;
        }

        console.log(`Fetching avatar for ${sponsor.name} from ${avatarUrl}...`);

        let base64Image;
        try {
            base64Image = await fetchImage(avatarUrl);
            console.log(`✓ Successfully fetched ${sponsor.name}`);
        } catch (err) {
            console.error(`✗ Failed to fetch ${sponsor.name}:`, err.message);
            // Fallback to generated avatar
            avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(sponsor.name)}&background=random&size=128&format=png`;
            base64Image = await fetchImage(avatarUrl);
        }

        const link = sponsor.github ? `https://github.com/${sponsor.github}` : '#';

        clipPaths += `
      <clipPath id="circle-${i}">
        <circle cx="${centerX}" cy="${centerY}" r="${avatarSize / 2}"/>
      </clipPath>
    `;

        content += `
      <a href="${link}" target="_blank" rel="noopener">
        <g class="avatar-${i}">
          <image 
            x="${x}" 
            y="${y}" 
            width="${avatarSize}" 
            height="${avatarSize}" 
            href="${base64Image}"
            clip-path="url(#circle-${i})"
          />
        </g>
        <text x="${centerX}" y="${y + avatarSize + 15}" class="name">${sponsor.name}</text>
      </a>
    `;

        avatarStyles += `
      .avatar-${i} {
        transform-origin: ${centerX}px ${centerY}px;
        transition: transform 0.2s;
      }
      .avatar-${i}:hover {
        transform: scale(1.1);
      }
    `;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        font-size: 24px;
        font-weight: 600;
        fill: #1f2328;
      }
      .name {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 11px;
        fill: #57606a;
        text-anchor: middle;
      }
      ${avatarStyles}
    </style>
    ${clipPaths}
  </defs>
  
  <rect width="${width}" height="${height}" fill="#ffffff" rx="10"/>
  
  <text x="${width / 2}" y="30" class="title" text-anchor="middle">💖 Supporters</text>
  ${content}
</svg>`;
}

(async () => {
    try {
        const svg = await generateSVG(data.sponsors);
        fs.writeFileSync('sponsors.svg', svg);
        console.log('✓ Generated sponsors.svg with embedded images');
    } catch (err) {
        console.error('✗ Error generating SVG:', err);
        process.exit(1);
    }
})();