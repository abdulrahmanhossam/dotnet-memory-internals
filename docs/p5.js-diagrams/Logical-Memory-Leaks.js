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
    text(".NET Logical Memory Leaks: The Silent Killers", width / 2, 35);
    textStyle(NORMAL);

    let gColor = color(50, 160, 80);  // Reachable (Alive)
    let rColor = color(200, 60, 60);  // Unreachable (Garbage)
    let leakColor = color(255, 100, 50); // Leak Warning Color

    // ==========================================
    // 1. The Subscription Trap (Event Handlers)
    // ==========================================
    drawPanel(40, 90, 1120, 220, "1. The Subscription Trap (Event Handlers)", color(40, 45, 55));

    let phase1 = floor(t / 120) % 4;
    // 0: Create & Subscribe, 1: Process, 2: Nullify local, 3: GC Sweep (Leak!)

    let pubX = 150, pubY = 150;
    let subX = 650, subY = 150;

    // Publisher (Always Alive)
    drawBlock(pubX, pubY, 200, 80, color(80, 100, 140), "Publisher Object\n(Long-lived)");

    if (phase1 < 3) {
        drawBlock(subX, pubY, 220, 80, gColor, "Subscriber Object");
        // Local Reference
        drawAnimatedArrow(subX + 300, pubY + 40, subX + 230, pubY + 40, gColor, "Local Scope", false);
    } else {
        // Leaked Object
        drawBlock(subX, pubY, 220, 80, leakColor, "Leaked Subscriber\n(Cannot be swept!)");
        fill(rColor); textSize(14); textAlign(LEFT, CENTER); textStyle(BOLD);
        text("Local scope ended (null)", subX + 250, pubY + 40); textStyle(NORMAL);
    }

    // The Delegate Link (The trap)
    if (phase1 > 0) {
        stroke(leakColor); strokeWeight(4); drawingContext.setLineDash([5, 5]);
        line(pubX + 200, pubY + 40, subX, subY + 40); drawingContext.setLineDash([]); noStroke();
        fill(leakColor); textSize(14); textStyle(BOLD); textAlign(CENTER, BOTTOM);
        text("publisher.DataChanged += MyHandler\n(Hidden GC Root!)", (pubX + 200 + subX) / 2, pubY + 30); textStyle(NORMAL);
    }

    if (phase1 === 3) {
        fill(255, 50, 50); textSize(20); textStyle(BOLD);
        text("🧹 GC Tries to Sweep... BLOCKED by Event Delegate!", (pubX + 200 + subX) / 2, pubY + 110); textStyle(NORMAL);
    }


    // ==========================================
    // 2. The Eternal Cache (Static Collections)
    // ==========================================
    drawPanel(40, 330, 540, 430, "2. Static Collections (No Eviction)", color(50, 40, 45));

    // Static Root
    drawBlock(100, 400, 420, 40, color(140, 100, 140), "public static Dictionary<string, Data> Cache;");

    // Box for Cache
    fill(30); stroke(100); strokeWeight(2);
    rect(150, 460, 320, 260, 5); noStroke();

    // Dropping Data Blocks
    let maxBlocks = 45;
    let blocks = (t % 300) / (300 / maxBlocks);
    let ramUsage = map(blocks, 0, maxBlocks, 0, 100);

    for (let i = 0; i < blocks; i++) {
        let col = i % 5;
        let row = floor(i / 5);
        fill(ramUsage > 85 ? leakColor : gColor); stroke(25); strokeWeight(1);
        rect(160 + (col * 60), 680 - (row * 24), 55, 20, 3);
    }
    noStroke();

    // RAM Usage Bar
    fill(50); rect(150, 730, 320, 15, 5);
    fill(ramUsage > 85 ? color(255, 50, 50) : color(50, 150, 255));
    rect(150, 730, 320 * (ramUsage / 100), 15, 5);
    fill(255); textSize(14); textStyle(BOLD); textAlign(CENTER, TOP);
    text(`RAM Usage: ${floor(ramUsage)}%`, 310, 750);

    if (ramUsage > 85) {
        fill(255, 50, 50); textSize(24);
        text("🔥 OUT OF MEMORY!", 310, 580);
    } textStyle(NORMAL);


    // ==========================================
    // 3. Captured Variables (Lambdas)
    // ==========================================
    drawPanel(600, 330, 560, 430, "3. Captured Variables in Lambdas (Closures)", color(40, 50, 55));

    let phase3 = floor(t / 180) % 2; // 0: Normal, 1: Compiled

    fill(200); textSize(14); textAlign(LEFT, TOP);
    text("byte[] heavyData = new byte[10MB];\nAction myLambda = () => Process(heavyData);", 630, 390);

    if (phase3 === 0) {
        // Before Compilation concept
        drawBlock(680, 520, 150, 80, color(100, 150, 200), "myLambda\n(Delegate)");
        drawBlock(900, 520, 180, 80, gColor, "heavyData\n(10 MB)");
        drawAnimatedArrow(830, 560, 900, 560, color(200), "Uses", false);
    } else {
        // What the compiler actually does (The Closure Trap)
        fill(60, 50, 50); stroke(leakColor); strokeWeight(3); drawingContext.setLineDash([5, 5]);
        rect(630, 480, 500, 240, 10); drawingContext.setLineDash([]); noStroke();

        fill(leakColor); textSize(16); textStyle(BOLD); textAlign(CENTER, TOP);
        text("Compiler-Generated Hidden Class (Closure)", 880, 490); textStyle(NORMAL);

        drawBlock(680, 580, 150, 80, color(100, 150, 200), "myLambda");
        drawBlock(900, 580, 180, 80, leakColor, "heavyData\n(10 MB Trapped!)");

        stroke(leakColor); strokeWeight(3);
        line(830, 620, 900, 620); noStroke();
        fill(255); textSize(13); textAlign(CENTER, BOTTOM);
        text("Hidden Reference", 865, 615);

        fill(255, 150, 150); textSize(14); textAlign(CENTER, TOP);
        text("If the lambda lives long, the 10MB data\nlives long with it, even if unused elsewhere!", 880, 675);
    }
}

// Helper Functions
function drawPanel(x, y, w, h, title, bgColor) {
    fill(bgColor); stroke(50); strokeWeight(2);
    rect(x, y, w, h, 15); noStroke();
    fill(255); textSize(20); textStyle(BOLD); textAlign(CENTER, TOP);
    text(title, x + w / 2, y + 15); textStyle(NORMAL);
}

function drawBlock(x, y, w, h, col, label) {
    fill(col); stroke(255); strokeWeight(2);
    rect(x, y, w, h, 8); noStroke();
    fill(255); textSize(16); textStyle(BOLD); textAlign(CENTER, CENTER);
    text(label, x + w / 2, y + h / 2); textStyle(NORMAL);
}

function drawAnimatedArrow(x1, y1, x2, y2, col, label, animate) {
    let yOffset = animate ? (frameCount % 10 < 5 ? 3 : 0) : 0;
    stroke(col); fill(col); strokeWeight(3);
    line(x1, y1 + yOffset, x2, y2 + yOffset);
    push(); translate(x2, y2 + yOffset);
    let angle = atan2(y2 - y1, x2 - x1); rotate(angle);
    triangle(0, 0, -10, -5, -10, 5); pop(); noStroke();
    fill(col); textSize(14); textStyle(BOLD); textAlign(CENTER, BOTTOM);
    text(label, (x1 + x2) / 2, min(y1, y2) - 5 + yOffset); textStyle(NORMAL);
}