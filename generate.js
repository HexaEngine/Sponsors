const fs = require("fs");

const data = JSON.parse(fs.readFileSync("sponsors.json", "utf8"));

function generateSVG(sponsors) {
  const avatarSize = 60;
  const spacing = 10;
  const columns = 6;
  const padding = 20;

  const rows = Math.ceil(sponsors.length / columns);
  const width = (avatarSize + spacing) * columns + padding * 2 - spacing;
  const headerHeight = 40;
  const height = headerHeight + (avatarSize + spacing + 20) * rows + padding;

  let clipPaths = "";
  let content = "";

  sponsors.forEach((sponsor, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = padding + col * (avatarSize + spacing);
    const y = headerHeight + padding + row * (avatarSize + spacing + 20);
    const centerX = x + avatarSize / 2;
    const centerY = y + avatarSize / 2;

    const avatarUrl = sponsor.github
      ? `https://github.com/${sponsor.github}.png`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          sponsor.name
        )}&amp;background=random&amp;size=128`;

    const link = sponsor.github ? `https://github.com/${sponsor.github}` : "#";

    // Create unique clipPath for each avatar
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
            href="${avatarUrl}"
            clip-path="url(#circle-${i})"
          />
        </g>
        <text x="${centerX}" y="${y + avatarSize + 15}" class="name">${
      sponsor.name
    }</text>
      </a>
    `;
  });

  // Generate CSS for each avatar with correct transform-origin
  let avatarStyles = "";
  sponsors.forEach((sponsor, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = padding + col * (avatarSize + spacing);
    const y = headerHeight + padding + row * (avatarSize + spacing + 20);
    const centerX = x + avatarSize / 2;
    const centerY = y + avatarSize / 2;

    avatarStyles += `
      .avatar-${i} {
        transform-origin: ${centerX}px ${centerY}px;
        transition: transform 0.2s;
      }
      .avatar-${i}:hover {
        transform: scale(1.1);
      }
    `;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@600&amp;display=swap');
      .title { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
  
  <text x="${
    width / 2
  }" y="30" class="title" text-anchor="middle">💖 Supporters</text>
  ${content}
</svg>`;
}

const svg = generateSVG(data.sponsors);
fs.writeFileSync("sponsors.svg", svg);
console.log("Generated sponsors.svg");
