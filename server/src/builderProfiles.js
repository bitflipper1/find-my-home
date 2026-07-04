// Reads the builder knowledge base (server/data/builders/*.md) plus the
// rankings and source-index docs that sit alongside it, so the frontend can
// render them without a build-time markdown pipeline.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BUILDERS_DIR = path.join(DATA_DIR, 'builders');

function titleFromMarkdown(content, fallback) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

function slugify(filename) {
  return filename.replace(/\.md$/, '');
}

function getBuilderProfiles() {
  const profiles = [];

  if (fs.existsSync(BUILDERS_DIR)) {
    for (const filename of fs.readdirSync(BUILDERS_DIR).sort()) {
      if (!filename.endsWith('.md') || filename === 'README.md') continue;
      const content = fs.readFileSync(path.join(BUILDERS_DIR, filename), 'utf8');
      profiles.push({
        slug: slugify(filename),
        title: titleFromMarkdown(content, slugify(filename)),
        content,
      });
    }
  }

  const rankingsPath = path.join(DATA_DIR, 'rankings.md');
  const sourceIndexPath = path.join(DATA_DIR, 'sources', 'source-index.md');
  const builderIndexPath = path.join(BUILDERS_DIR, 'README.md');

  return {
    profiles,
    rankings: fs.existsSync(rankingsPath) ? fs.readFileSync(rankingsPath, 'utf8') : null,
    source_index: fs.existsSync(sourceIndexPath) ? fs.readFileSync(sourceIndexPath, 'utf8') : null,
    builders_index: fs.existsSync(builderIndexPath) ? fs.readFileSync(builderIndexPath, 'utf8') : null,
  };
}

module.exports = { getBuilderProfiles };
