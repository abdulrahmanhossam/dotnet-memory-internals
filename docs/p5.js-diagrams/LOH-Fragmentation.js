let t = 0;

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
    text(".NET GC: The LOH & Memory Fragmentation Trap", width / 2, 40);
    textStyle(NORMAL);

    // ==========================================
    // Timing Logic for the Story
    // ==========================================
    let phaseLength = 240; // 4 seconds per phase
    let phase = floor(t / phaseLength) % 5;
    // Phase 0: Allocate 3 objects
    // Phase 1: Middle object dies (Sweep)
    // Phase 2: Attempt to allocate new 120KB object (Fails to fit)
    // Phase 3: Allocate at the end (Fragmentation created)
    // Phase 4: Wait and restart

    // ==========================================
    // LOH Container
    // ==========================================
    fill(45, 35, 45); stroke(100, 50, 50); strokeWeight(3);
    rect(100, 150, 1000, 500, 15); noStroke();

    fill(255); textSize(22); textStyle(BOLD); textAlign(CENTER, TOP);
    text("Large Object Heap (LOH) - Address Space", width / 2, 170); textStyle(NORMAL);

    fill(200); textSize(16);
    text("Rule: No Compaction. Objects stay exactly where they are allocated.", width / 2, 205);

    // Status Text
    fill(255, 200, 100); textSize(24); textStyle(BOLD);
    let statusTxt = "";
    if (phase === 0) statusTxt = "Phase 1: Allocating 3 Large Objects (e.g., Arrays)...";
    if (phase === 1) statusTxt = "Phase 2: Object B becomes unreachable. GC Sweeps it.";
    if (phase === 2) statusTxt = "Phase 3: App requests 120 KB. Searching for Contiguous Block...";
    if (phase === 3 || phase === 4) statusTxt = "Phase 4: Fragmentation! 100 KB gap unused. OS provides new memory.";
    text(statusTxt, width / 2, 250); textStyle(NORMAL);

    // ==========================================
    // Drawing the Memory Blocks
    // ==========================================
    let blockY = 320;
    let blockH = 150;

    let gColor = color(50, 160, 80);  // Live Object
    let bColor = color(50, 100, 200); // New Object

    // Base Block A (Always there)
    drawBlock(150, blockY, 250, blockH, gColor, "Object A\n(200 KB)", 255);

    // Block B (Dies in Phase 1)
    if (phase === 0) {
        drawBlock(410, blockY, 200, blockH, gColor, "Object B\n(100 KB)", 255);
    } else {
        // The "Hole" (Fragmented space)
        fill(40); stroke(150, 50, 50); drawingContext.setLineDash([10, 10]); strokeWeight(3);
        rect(410, blockY, 200, blockH, 8); drawingContext.setLineDash([]); noStroke();
        fill(200, 100, 100); textAlign(CENTER, CENTER); textSize(16);
        text("HOLE / GAP\n(100 KB Free)", 510, blockY + blockH / 2);
    }

    // Base Block C (Always there)
    drawBlock(620, blockY, 180, blockH, gColor, "Object C\n(150 KB)", 255);

    // The New Object Attempt (Phase 2 & 3)
    if (phase === 2) {
        // Attempting to fit in the hole (Animation)
        let moveY = map(sin(frameCount * 0.1), -1, 1, blockY - 100, blockY - 80);
        drawBlock(410, moveY, 240, blockH, color(200, 150, 50), "New Object\n(120 KB)", 255); // Warning color

        // Draw "Doesn't Fit" icon
        fill(255, 50, 50); textSize(40); textStyle(BOLD);
        text("X", 530, moveY + blockH / 2); textStyle(NORMAL);
    }

    if (phase >= 3) {
        // Forced to allocate at the end
        drawBlock(810, blockY, 240, blockH, bColor, "New Object\n(120 KB)", 255);

        // Warning Arrow pointing to the hole
        let arrowColor = color(255, 100, 100);
        stroke(arrowColor); fill(arrowColor); strokeWeight(4);
        line(510, blockY + blockH + 60, 510, blockY + blockH + 10);
        push(); translate(510, blockY + blockH + 10); triangle(0, 0, -10, 15, 10, 15); pop(); noStroke();

        fill(arrowColor); textSize(16); textStyle(BOLD); textAlign(CENTER, TOP);
        text("Wasted Space!\n(Fragmentation)", 510, blockY + blockH + 70); textStyle(NORMAL);
    }

    // ==========================================
    // Warning Box (Bottom)
    // ==========================================
    fill(35); stroke(200, 100, 100); strokeWeight(2);
    rect(100, 680, 1000, 80, 10); noStroke();
    fill(255, 150, 150); textSize(18); textAlign(CENTER, CENTER);
    text("⚠️ OutOfMemoryException Danger ⚠️", width / 2, 705);
    fill(200); textSize(15);
    text("The OS might throw OOM even if total free RAM > 120 KB, because the CLR cannot find a CONTIGUOUS block.", width / 2, 735);
}

// Helper Function
function drawBlock(x, y, w, h, col, label, alpha) {
    fill(red(col), green(col), blue(col), alpha);
    stroke(255, alpha); strokeWeight(2);
    rect(x, y, w, h, 8); noStroke();
    fill(255, alpha); textSize(18); textStyle(BOLD); textAlign(CENTER, CENTER);
    text(label, x + w / 2, y + h / 2); textStyle(NORMAL);
}