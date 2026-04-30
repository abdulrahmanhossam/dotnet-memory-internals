let t = 0; // Time tracker

function setup() {
    createCanvas(1200, 800);
    frameRate(60);
}

function draw() {
    t++;
    background(25); // Dark theme

    // Title
    fill(255);
    textSize(28);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    text(".NET GC: The Generational Hypothesis (Animated & Accurate)", width / 2, 40);
    textStyle(NORMAL);

    // ==========================================
    // Accurate GC Nested Timing Logic
    // ==========================================
    // Gen 0: Sweeps every 7 seconds (420 frames)
    let cycle0 = 420;
    let alloc0 = 360; // Allocates for 360, sweeps for 60
    let p0 = min(1, (t % cycle0) / alloc0);
    let sweep0 = (t % cycle0) >= alloc0;
    let sFrame0 = max(0, (t % cycle0) - alloc0);

    // Gen 1: Sweeps every 3 Gen 0 cycles (1260 frames)
    // When Gen 1 sweeps, Gen 0 ALSO sweeps!
    let cycle1 = cycle0 * 3;
    let alloc1 = cycle1 - 60; // Synchronized 60-frame sweep window
    let p1 = min(1, (t % cycle1) / alloc1);
    let sweep1 = (t % cycle1) >= alloc1;
    let sFrame1 = max(0, (t % cycle1) - alloc1);

    // Gen 2: Sweeps every 3 Gen 1 cycles (3780 frames) - FULL GC
    // When Gen 2 sweeps, Gen 1 & Gen 0 ALSO sweep!
    let cycle2 = cycle1 * 3;
    let alloc2 = cycle2 - 60;
    let p2 = min(1, (t % cycle2) / alloc2);
    let sweep2 = (t % cycle2) >= alloc2;
    let sFrame2 = max(0, (t % cycle2) - alloc2);

    // Determine Sweep Text based on nesting
    let text0 = sweep2 ? "🧹 FULL GC (Gen 0+1+2)" : (sweep1 ? "🧹 GEN 1+0 GC" : "🧹 GEN 0 GC");
    let text1 = sweep2 ? "🧹 FULL GC (Gen 0+1+2)" : "🧹 GEN 1+0 GC";
    let text2 = "🧹 FULL GC RUNNING!";

    // ==========================================
    // 1. Small Object Heap (SOH)
    // ==========================================
    fill(40, 50, 70); stroke(50); strokeWeight(2);
    rect(40, 100, 700, 660, 15); noStroke();
    fill(255); textSize(18); textStyle(BOLD); textAlign(CENTER, TOP);
    text("Small Object Heap (SOH) - Objects < 85,000 Bytes", 390, 115); textStyle(NORMAL);

    let gColor = color(50, 160, 80);  // Live Object
    let rColor = color(200, 60, 60);  // Dead Object

    // --- GEN 0 (Playground) ---
    drawGenLevel(60, 160, 660, 180, "Generation 0: The Playground", color(60, 70, 90), p0, sweep0, text0, "O(1) allocation. Cleared frequently.");
    drawObjects(90, 260, 8, p0, sweep0, sFrame0, [3, 6], gColor, rColor);

    drawAnimatedArrow(390, 340, 390, 390, sweep0, "Promoting Survivors");

    // --- GEN 1 (Buffer) ---
    drawGenLevel(60, 390, 660, 160, "Generation 1: The Buffer", color(50, 80, 80), p1, sweep1, text1, "Transitional generation. Collected less frequently.");
    drawObjects(200, 490, 4, p1, sweep1, sFrame1, [1, 3], gColor, rColor);

    drawAnimatedArrow(390, 550, 390, 600, sweep1, "Promoting Survivors");

    // --- GEN 2 (Retirement Home) ---
    drawGenLevel(60, 600, 660, 140, "Generation 2: The Retirement Home", color(70, 60, 80), p2, sweep2, text2, "Long-lived objects. Collected rarely (Full GC).");
    drawObjects(250, 690, 3, p2, sweep2, sFrame2, [0, 1, 2], gColor, rColor);


    // ==========================================
    // 2. Large Object Heap (LOH)
    // ==========================================
    fill(60, 50, 50); stroke(50); strokeWeight(2);
    rect(780, 100, 380, 660, 15); noStroke();
    fill(255); textSize(18); textStyle(BOLD); textAlign(CENTER, TOP);
    text("Large Object Heap (LOH)", 970, 115); textStyle(NORMAL);

    fill(200); textSize(14); textAlign(LEFT, TOP);
    text("Objects >= 85,000 Bytes\n(Direct allocation, bypassed Ephemeral segments)", 800, 150);

    if (frameCount % 60 < 30) fill(255, 100, 100); else fill(200, 50, 50);
    text("WARNING: Usually NOT compacted by default.\nProne to Memory Fragmentation.", 800, 200);

    fill(gColor); stroke(255); strokeWeight(2); rect(810, 270, 320, 120, 10); noStroke(); fill(255); textAlign(CENTER, CENTER);
    text("Huge Array / Buffer (e.g., 100 KB)", 970, 330);

    fill(60); stroke(150, 50, 50); drawingContext.setLineDash([5, 5]);
    rect(810, 420, 320, 100, 10); drawingContext.setLineDash([]); noStroke(); fill(255);
    text("Free Space (Fragmented)", 970, 470);

    fill(gColor); stroke(255); rect(810, 550, 320, 150, 10); noStroke(); fill(255);
    text("Large Image / File Stream (e.g., 2 MB)", 970, 625);

    // ==========================================
    // Legend
    // ==========================================
    fill(30); stroke(100); strokeWeight(1); rect(810, 715, 320, 40, 8); noStroke();
    fill(gColor); ellipse(835, 735, 15, 15); fill(255); textAlign(LEFT, CENTER); textSize(13); text("Live Object", 855, 735);
    fill(rColor); ellipse(965, 735, 15, 15); fill(255); text("Garbage (Will be swept)", 985, 735);
}

// ==========================================
// UI & Animation Helpers
// ==========================================
function drawGenLevel(x, y, w, h, title, bgColor, progress, isSweeping, sweepText, desc) {
    fill(bgColor); stroke(isSweeping ? color(200, 150, 50) : 50); strokeWeight(isSweeping ? 4 : 2);
    rect(x, y, w, h, 15); noStroke();

    // Explicit Left Alignment for Text to prevent overlap
    fill(255); textSize(16); textStyle(BOLD); textAlign(LEFT, TOP);
    text(title, x + 20, y + 15); textStyle(NORMAL);
    fill(200); textSize(13); text(desc, x + 20, y + 40);

    // Explicit Right Alignment for Progress Bar
    let barW = 150;
    let barX = x + w - barW - 20;
    let barY = y + 15;

    fill(30); rect(barX, barY, barW, 15, 5);

    if (isSweeping) {
        fill(255, 50, 50); rect(barX, barY, barW, 15, 5);
        fill(255, 100, 100); textAlign(RIGHT, TOP); textSize(12); textStyle(BOLD);
        text(sweepText, barX - 10, barY + 2); textStyle(NORMAL);
    } else {
        fill(50, 150, 255); rect(barX, barY, barW * progress, 15, 5);
        fill(150, 200, 255); textAlign(RIGHT, TOP); textSize(12);
        text("Allocating...", barX - 10, barY + 2);
    }
}

function drawObjects(startX, y, count, progress, isSweeping, sFrame, liveIndices, gColor, rColor) {
    for (let i = 0; i < count; i++) {
        if (progress > (i / count) || isSweeping) {
            let isLive = liveIndices.includes(i);
            let size = 50; let alpha = 255;

            if (isSweeping) {
                if (!isLive) {
                    size = max(0, 50 - (sFrame * 2));
                    alpha = max(0, 255 - (sFrame * 10));
                } else {
                    size = 50 + sin(frameCount * 0.5) * 3; // Pulse
                }
            }

            if (size > 0) {
                fill(isLive ? color(50, 160, 80, alpha) : color(200, 60, 60, alpha));
                stroke(255, alpha); strokeWeight(2); ellipse(startX + (i * 75), y, size, size);
            }
        }
    }
}

function drawAnimatedArrow(x1, y1, x2, y2, isSweeping, label) {
    let arrowColor = isSweeping ? color(50, 255, 150) : color(100, 150, 255);
    let yOffset = isSweeping ? (frameCount % 10 < 5 ? 5 : 0) : 0;

    stroke(arrowColor); fill(arrowColor); strokeWeight(isSweeping ? 6 : 4);
    line(x1, y1, x2, y2 + yOffset);

    push(); translate(x2, y2 + yOffset); triangle(0, 0, -10, -15, 10, -15); pop(); noStroke();

    fill(arrowColor); textSize(13); textStyle(BOLD); textAlign(LEFT, CENTER);
    text(isSweeping ? label : "Awaiting Promotion", x1 + 20, y1 + (y2 - y1) / 2); textStyle(NORMAL);
}