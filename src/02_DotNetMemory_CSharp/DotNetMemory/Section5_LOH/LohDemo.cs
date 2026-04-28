namespace DotNetMemory.Section5_LOH;

public class LohDemo
{
    public static void RunDemo()
    {
        Console.WriteLine("\n=== Section 5: LOH & Memory Fragmentation ===\n");

        // We use GC.GetGCMemoryInfo() to read internal CLR metrics, specifically Fragmentation.
        Console.WriteLine($"[Info] Initial Heap Fragmentation: {GetFragmentationInMB()} MB");

        Console.WriteLine("\n[Mark] Allocating 5 Large Objects (100 KB each)...");
        // We use a List to hold references so the GC doesn't collect them immediately.
        List<byte[]> lohList = new List<byte[]>();
        for (int i = 0; i < 5; i++)
        {
            // 100,000 bytes > 85,000 bytes. These go directly to the Large Object Heap (LOH).
            lohList.Add(new byte[100_000]);
        }

        Console.WriteLine("\n[Action] Deleting Objects 2 and 4 to create 'Holes' (Fragmentation)...");
        // By setting these to null, we sever the Roots. 
        // The LOH will now look like this: [100KB] [HOLE] [100KB] [HOLE] [100KB]
        lohList[1] = null!;
        lohList[3] = null!;

        Console.WriteLine("[Action] Forcing Garbage Collection...");
        // This will sweep the unreachable objects, BUT it will NOT compact the LOH by default.
        GC.Collect();
        GC.WaitForPendingFinalizers();

        // Let's prove that the holes are still there and the memory was NOT compacted!
        double fragmentation = GetFragmentationInMB();
        Console.WriteLine($"\n[Warning] Heap Fragmentation after GC: {fragmentation} MB");
        Console.WriteLine("   ---> [GC ACTION] The GC swept the dead objects, but left the gaps (No Compaction)!");

        Console.WriteLine("\n[Action] Requesting a new Object of 120 KB...");
        // The CLR will check the LOH. It sees the 100 KB holes, but 120 KB doesn't fit!
        // Even though we have 200 KB of total free space, it's fragmented.
        // Result: The CLR is forced to request NEW memory from the OS, increasing the Process size.
        byte[] tooBigForHole = new byte[120_000];
        Console.WriteLine("[Result] 120 KB object successfully allocated at the END of the LOH.");

        Console.WriteLine("\n   ---> [Conclusion] If this keeps happening in a loop, the OS will run out of memory, causing an OutOfMemoryException, even if the total 'free' gaps are gigabytes in size!");

        // Cleanup
        lohList.Clear();
        tooBigForHole = null!;
    }

    // A helper method to get the exact fragmented bytes in the Heap
    private static double GetFragmentationInMB()
    {
        GCMemoryInfo gcInfo = GC.GetGCMemoryInfo();
        // Convert bytes to Megabytes for easier reading
        return Math.Round(gcInfo.FragmentedBytes / (1024.0 * 1024.0), 4);
    }
}