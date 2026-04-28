using System;

namespace DotNetMemory.Section4_Generations;

public class GenerationsDemo
{
    public static void RunDemo()
    {
        Console.WriteLine("\n=== Section 4: Generational GC & LOH ===\n");

        // 1. SMALL OBJECT HEAP (SOH) DEMO
        Console.WriteLine("--- 1. Small Object Heap (Generations 0 -> 1 -> 2) ---");

        // Allocating a small object (1 KB). It should go to Gen 0 (The Playground).
        byte[] smallObj = new byte[1024];
        Console.WriteLine($"[Init] smallObj created. Current Generation: {GC.GetGeneration(smallObj)}");

        // Force a Garbage Collection ONLY for Generation 0.
        // Since 'smallObj' is still reachable (in use), it will SURVIVE and get PROMOTED.
        Console.WriteLine("\n[Action] Forcing GC on Gen 0...");
        GC.Collect(0);
        Console.WriteLine($"[Result] smallObj survived! Promoted to Generation: {GC.GetGeneration(smallObj)}");

        // Force a Garbage Collection for Generation 1.
        // It survives again and moves to the final stage (The Retirement Home).
        Console.WriteLine("\n[Action] Forcing GC on Gen 1...");
        GC.Collect(1);
        Console.WriteLine($"[Result] smallObj survived again! Promoted to Generation: {GC.GetGeneration(smallObj)}");


        // 2. LARGE OBJECT HEAP (LOH) DEMO
        Console.WriteLine("\n--- 2. Large Object Heap (LOH) ---");

        // Allocating a large object (> 85,000 bytes). 
        // The CLR skips Gen 0 and Gen 1 completely to avoid expensive memory copying (Compaction).
        // 85000 bytes + some array overhead = goes to LOH.
        byte[] largeObj = new byte[86000];

        // In .NET, objects in the LOH are tracked as part of Generation 2 (or Gen 3 internally in modern .NET).
        // GC.GetGeneration() will return 2, proving it bypassed the young generations.
        Console.WriteLine($"[Init] largeObj (>85KB) created. Current Generation: {GC.GetGeneration(largeObj)}");

        // Just to prove how many generations .NET supports (0, 1, 2)
        Console.WriteLine($"\n[Info] Maximum Generation supported by this OS/CLR: {GC.MaxGeneration}");
    }
}