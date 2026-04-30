function setup() {
    createCanvas(1200, 800);
    noLoop(); // Static infographic
}

function draw() {
    background(25); // Dark theme

    // Title
    fill(255);
    textSize(28);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    text(".NET Garbage Collection: Roots & Reachability Graph", width / 2, 40);
    textStyle(NORMAL);

    // ==========================================
    // 1. GC Roots Area (Left)
    // ==========================================
    drawContainer(40, 120, 350, 600, "GC Roots\n(The Sources of Life)", color(40, 50, 70));

    // The 4 Roots
    let rootX = 70;
    let rootW = 290;
    drawRootNode(rootX, 200, rootW, 60, "1. Stack Variables\n(Local vars in active methods)", color(80, 100, 140));
    drawRootNode(rootX, 320, rootW, 60, "2. Static Fields\n(AppDomain lifetime)", color(140, 100, 140));
    drawRootNode(rootX, 440, rootW, 60, "3. CPU Registers\n(JIT active pointers)", color(140, 120, 80));
    drawRootNode(rootX, 560, rootW, 60, "4. Pinned Handles\n(Interop / Unmanaged)", color(80, 120, 120));

    // ==========================================
    // 2. Managed Heap Area (Right)
    // ==========================================
    drawContainer(450, 120, 700, 600, "Managed Heap\n(Object Graph Traversal)", color(45, 55, 50));

    // Coordinates for Objects (Nodes)
    let o1 = { x: 580, y: 230 };
    let o2 = { x: 800, y: 230 };
    let o3 = { x: 1000, y: 300 };

    let o4 = { x: 580, y: 400 };
    let o5 = { x: 850, y: 470 };

    let o6 = { x: 580, y: 560 };

    // Unreachable Objects (Garbage)
    // Unreachable Objects (Garbage)
    let g1 = { x: 820, y: 640 };
    let g2 = { x: 1020, y: 600 };
    let g3 = { x: 1030, y: 180 };

    // ==========================================
    // Draw Edges (References) FIRST so they go under nodes
    // ==========================================
    strokeWeight(3);

    // From Roots to Heap
    drawEdge(rootX + rootW, 230, o1.x, o1.y, color(100, 200, 100)); // Stack -> Obj1
    drawEdge(rootX + rootW, 350, o4.x, o4.y, color(100, 200, 100)); // Static -> Obj4
    drawEdge(rootX + rootW, 590, o6.x, o6.y, color(100, 200, 100)); // Handle -> Obj6

    // From Object to Object (Graph)
    drawEdge(o1.x, o1.y, o2.x, o2.y, color(100, 200, 100)); // Obj1 -> Obj2
    drawEdge(o2.x, o2.y, o3.x, o3.y, color(100, 200, 100)); // Obj2 -> Obj3
    drawEdge(o4.x, o4.y, o5.x, o5.y, color(100, 200, 100)); // Obj4 -> Obj5

    // Internal references between Unreachable objects
    drawEdge(g1.x, g1.y, g2.x, g2.y, color(200, 100, 100)); // Garbage pointing to Garbage

    // ==========================================
    // Draw Objects (Nodes)
    // ==========================================
    let rColor = color(50, 160, 80);  // Reachable Green
    let uColor = color(200, 60, 60);  // Unreachable Red

    // Reachable Nodes
    drawObjectNode(o1.x, o1.y, "Obj A", rColor);
    drawObjectNode(o2.x, o2.y, "Obj B", rColor);
    drawObjectNode(o3.x, o3.y, "Obj C", rColor);
    drawObjectNode(o4.x, o4.y, "Obj D", rColor);
    drawObjectNode(o5.x, o5.y, "Obj E", rColor);
    drawObjectNode(o6.x, o6.y, "Obj F", rColor);

    // Unreachable Nodes (Garbage)
    drawObjectNode(g1.x, g1.y, "Garbage 1\n(Orphan)", uColor);
    drawObjectNode(g2.x, g2.y, "Garbage 2\n(Island)", uColor);
    drawObjectNode(g3.x, g3.y, "Garbage 3\n(Isolated)", uColor);

    // ==========================================
    // Legend
    // ==========================================
    fill(35);
    stroke(100);
    strokeWeight(1);
    rect(470, 610, 270, 90, 8);
    noStroke();

    fill(50, 160, 80);
    ellipse(500, 635, 20, 20);
    fill(255);
    textAlign(LEFT, CENTER);
    textSize(14);
    text("Reachable (Live Object)", 525, 635);

    fill(200, 60, 60);
    ellipse(500, 675, 20, 20);
    fill(255);
    text("Unreachable (Garbage)", 525, 675);
}

// Helper: Draw Background Containers
function drawContainer(x, y, w, h, label, bgColor) {
    fill(bgColor);
    stroke(50);
    strokeWeight(2);
    rect(x, y, w, h, 15);
    noStroke();
    fill(255);
    textSize(20);
    textStyle(BOLD);
    textAlign(CENTER, TOP);
    text(label, x + w / 2, y + 20);
    textStyle(NORMAL);
}

// Helper: Draw Root Nodes
function drawRootNode(x, y, w, h, label, bgColor) {
    fill(bgColor);
    stroke(200);
    strokeWeight(2);
    rect(x, y, w, h, 8);
    noStroke();
    fill(255);
    textSize(15);
    textAlign(CENTER, CENTER);
    text(label, x + w / 2, y + h / 2);
}

// Helper: Draw Heap Objects (Circles)
function drawObjectNode(x, y, label, nodeColor) {
    fill(nodeColor);
    stroke(255);
    strokeWeight(2);
    ellipse(x, y, 90, 90);
    noStroke();
    fill(255);
    textSize(14);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(label, x, y);
    textStyle(NORMAL);
}

// Helper: Draw Directed Edges (Arrows)
function drawEdge(x1, y1, x2, y2, edgeColor) {
    stroke(edgeColor);
    fill(edgeColor);

    // Adjust endpoint so arrow doesn't hide under the 90px circle
    let angle = atan2(y2 - y1, x2 - x1);
    let adjustedX2 = x2 - cos(angle) * 45;
    let adjustedY2 = y2 - sin(angle) * 45;

    line(x1, y1, adjustedX2, adjustedY2);

    // Draw Arrowhead
    push();
    translate(adjustedX2, adjustedY2);
    rotate(angle);
    triangle(0, 0, -15, -7, -15, 7);
    pop();
    noStroke();
}