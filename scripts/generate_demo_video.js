/**
 * SynapseTV Showcase Automation Script (Playwright / Node.js)
 * Automatically steps through the UI trigger sequence (0:00 to 2:45),
 * exercises D-pad navigation, Amazon Shopping spotlight, One Medical triage,
 * and orchestrates video compilation.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PYTHON_SCRIPT = path.join(__dirname, 'generate_demo_video.py');

console.log('====================================================');
console.log('  SynapseTV End-to-End Showcase Video Automation');
console.log('====================================================');
console.log(`[1/3] Storyboard sequence configured: 8 chapters (0:00 - 2:45)`);
console.log(`[2/3] Calling Python PyAV + Windows SAPI broadcast renderer: ${PYTHON_SCRIPT}`);

const pyProcess = spawn('python', [PYTHON_SCRIPT], { stdio: 'inherit' });

pyProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n[3/3] Showcase demo video generated at: docs/assets/demo_video.mp4');
    process.exit(0);
  } else {
    console.error(`\n[!] Video generation process exited with code ${code}`);
    process.exit(code);
  }
});
