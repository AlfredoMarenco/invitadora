const fs = require('fs');
const svg = fs.readFileSync('public/resources_canvas/images/14.svg', 'utf8');

// Search for clipPath, rects, images, etc.
const clipMatches = svg.matchAll(/<clipPath[^>]*>.*?<\/clipPath>/gs);
for (const m of clipMatches) {
    console.log(m[0]);
}

const rectMatches = svg.matchAll(/<rect[^>]*>/g);
for (const m of rectMatches) {
    console.log(m[0]);
}

const imageMatches = svg.matchAll(/<image[^>]*>/g);
for (const m of imageMatches) {
    console.log(m[0]);
}
