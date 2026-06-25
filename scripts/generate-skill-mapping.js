const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const weapons = [
  'Weapon_Sword',
  'Weapon_Bow',
  'Weapon_Crossbow',
  'Weapon_Dagger',
  'Weapon_Gauntlet',
  'Weapon_Orb',
  'Weapon_Spear',
  'Weapon_Staff',
  'Weapon_Sword2h',
  'Weapon_Wand'
];

const allSkills = {
  active: new Set(),
  passive: new Set()
};

console.log('🔍 Analyzing weapon XML files...\n');

weapons.forEach(weapon => {
  const xmlPath = path.join('public', 'data', `${weapon}.xml.gz`);

  if (!fs.existsSync(xmlPath)) {
    console.log(`⚠️  ${weapon}.xml.gz not found, skipping...`);
    return;
  }

  const xml = zlib.gunzipSync(fs.readFileSync(xmlPath)).toString('utf-8');
  const skillPattern = /<skill_complex[^>]*id="([^"]+)"[^>]*skill_type="([^"]+)"[^>]*>/g;

  let match;
  let activeCount = 0;
  let passiveCount = 0;

  while ((match = skillPattern.exec(xml)) !== null) {
    const [, id, type] = match;
    if (type === 'kActiveSkill') {
      allSkills.active.add(id);
      activeCount++;
    } else if (type === 'kPassiveSkill') {
      allSkills.passive.add(id);
      passiveCount++;
    }
  }

  console.log(`✓ ${weapon.padEnd(20)} → ${activeCount} active, ${passiveCount} passive`);
});

// Convertir les Sets en Arrays pour JSON
const skillMapping = {
  active: Array.from(allSkills.active).sort(),
  passive: Array.from(allSkills.passive).sort(),
  metadata: {
    generated: new Date().toISOString(),
    totalActive: allSkills.active.size,
    totalPassive: allSkills.passive.size
  }
};

// Sauvegarder le mapping
const outputPath = path.join('public', 'data', 'skill-type-mapping.json');
fs.writeFileSync(outputPath, JSON.stringify(skillMapping, null, 2));

console.log(`\n✅ Generated skill mapping:`);
console.log(`   - ${skillMapping.metadata.totalActive} active skills`);
console.log(`   - ${skillMapping.metadata.totalPassive} passive skills`);
console.log(`   - Saved to: ${outputPath}`);

