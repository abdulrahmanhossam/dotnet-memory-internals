function setup()
{
    createCanvas(1200, 800);
    noLoop(); // Static infographic
}

function draw()
{
    background(25); // Very dark background

    // Title
    fill(255);
    textSize(28);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    text(".NET Memory Architecture: From OS Process to CLR Heaps", width / 2, 35);
    textStyle(NORMAL);

    // ==========================================
    // 1. The OS Process (Virtual Memory Boundary)
    // ==========================================
    // Using dashed lines to represent OS boundary
    stroke(100, 150, 255);
    strokeWeight(3);
    drawingContext.setLineDash([10, 10]); // Dashed border
    fill(35, 40, 50);
    rect(20, 80, 1160, 700, 15);
    drawingContext.setLineDash([]); // Reset to solid lines for the rest

    noStroke();
    fill(150, 200, 255);
    textSize(22);
    textAlign(LEFT, TOP);
    text("1. OS Process (Virtual Memory Allocated by Operating System)", 40, 100);

    // ==========================================
    // 2. The Threads Region (Isolated)
    // ==========================================
    // Thread 1
    drawContainer(50, 160, 320, 600, "2A. Thread 1 (Main)", color(40, 50, 70));
    drawContainer(70, 220, 280, 520, "Thread 1 Stack\n(Isolated - O(1) Allocation)", color(50, 60, 80));

    // Value Types inside Stack 1
    fill(200);
    textSize(14);
    text("Copy by Value:", 120, 290);
    drawMemorySlot(90, 310, 240, 35, "int x = 5", color(200, 100, 100));
    drawMemorySlot(90, 355, 240, 35, "int y = x", color(200, 100, 100));

    // Reference Types inside Stack 1
    fill(200);
    text("Copy by Reference (Pointers):", 120, 420);
    drawMemorySlot(90, 440, 240, 35, "User u1 = 0x8A4...", color(100, 150, 200));
    drawMemorySlot(90, 485, 240, 35, "User u2 = 0x8A4...", color(100, 150, 200));

    // Thread 2 (To prove isolation)
    drawContainer(390, 160, 180, 600, "2B. Thread 2\n(Worker)", color(40, 50, 70));
    drawContainer(405, 240, 150, 500, "Thread 2 Stack\n(Isolated)", color(50, 60, 80));
    drawMemorySlot(420, 310, 120, 35, "int z = 10", color(200, 100, 100));

    // ==========================================
    // 3. CLR Shared Memory Region
    // ==========================================
    drawContainer(590, 160, 570, 600, "3. CLR Shared Memory (Accessible by all Threads)", color(45, 55, 50));

    // 3A. Managed Heap
    drawContainer(610, 220, 300, 520, "Managed Heap\n(Dynamic - Requires GC)", color(50, 70, 50));

    // The User Object
    fill(40);
    stroke(100, 200, 100);
    strokeWeight(2);
    rect(635, 340, 250, 180, 8);
    noStroke();

    fill(150, 255, 150);
    textSize(16);
    textAlign(CENTER, TOP);
    text("User Object (Address: 0x8A4...)", 760, 350);

    // Inside the Object
    drawMemorySlot(650, 380, 220, 35, "Object Header (Sync Block)", color(80));
    drawMemorySlot(650, 425, 220, 35, "MethodTable Pointer", color(180, 150, 50)); // Highlighted
    drawMemorySlot(650, 470, 220, 40, "int age = 30\n(Value Type in Heap!)", color(200, 100, 100));

    // 3B. Loader Heap
    drawContainer(930, 220, 210, 520, "Loader Heap\n(High-Frequency)", color(70, 50, 70));

    // Method Table Structure
    fill(40);
    stroke(200, 100, 200);
    strokeWeight(2);
    rect(945, 380, 180, 110, 8);
    noStroke();

    fill(255, 150, 255);
    textSize(14);
    textAlign(CENTER, TOP);
    text("User Type Metadata", 1035, 395);
    drawMemorySlot(955, 420, 160, 25, "Calculate() Addr", color(80));
    drawMemorySlot(955, 455, 160, 25, "Compiled CPU Instr", color(80));

    // ==========================================
    // ARROWS (Connections across memory boundaries)
    // ==========================================
    strokeWeight(3);

    // u1 and u2 from Stack 1 pointing to Object in Heap
    drawArrow(330, 457, 630, 410, color(100, 150, 200)); // u1
    drawArrow(330, 502, 630, 430, color(100, 150, 200)); // u2

    // MethodTable Pointer to Loader Heap
    drawArrow(870, 442, 940, 442, color(180, 150, 50));
}

// Helper function to draw background containers with titles
function drawContainer(x, y, w, h, label, bgColor)
{
    fill(bgColor);
    stroke(30);
    strokeWeight(2);
    rect(x, y, w, h, 10);
    noStroke();
    fill(255);
    textSize(16);
    textStyle(BOLD);
    textAlign(CENTER, TOP);
    text(label, x + w / 2, y + 15);
    textStyle(NORMAL);
}

// Helper function to draw individual memory slots (variables/pointers)
function drawMemorySlot(x, y, w, h, label, slotColor)
{
    fill(slotColor);
    rect(x, y, w, h, 4);
    fill(255);
    textSize(13);
    textAlign(CENTER, CENTER);
    text(label, x + w / 2, y + h / 2);
}

// Helper function to draw directional arrows
function drawArrow(x1, y1, x2, y2, arrowColor)
{
    stroke(arrowColor);
    fill(arrowColor);
    line(x1, y1, x2, y2);

    // Arrow head
    push();
    translate(x2, y2);
    let angle = atan2(y2 - y1, x2 - x1);
    rotate(angle);
    triangle(0, 0, -12, -6, -12, 6);
    pop();
    noStroke();
}