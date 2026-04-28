using System.Runtime.CompilerServices;

namespace DotNetMemory.Section7_MemoryLeaks;

public class MemoryLeaksDemo
{
    // A Static Publisher simulates a long-lived service (e.g., Singleton in Dependency Injection)
    public static LongLivedPublisher GlobalPublisher = new LongLivedPublisher();

    public static void RunDemo()
    {
        Console.WriteLine("\n=== Section 7: Logical Memory Leaks (The Silent Killers) ===\n");

        Console.WriteLine("--- Scenario 1: The Event Subscription Trap ---");
        SimulateMemoryLeak();

        Console.WriteLine("\n[Action] Forcing Garbage Collection...");
        GC.Collect();
        GC.WaitForPendingFinalizers();
        // Result: The LeakySubscriber will NOT be collected! It's a Memory Leak.
        Console.WriteLine("   ---> [Result] GC ran, but the LeakySubscriber is still alive! The Publisher is holding it hostage.");


        Console.WriteLine("\n--- Scenario 2: The Proper Unsubscribe (IDisposable) ---");
        SimulateFixedSubscriber();

        Console.WriteLine("\n[Action] Forcing Garbage Collection...");
        GC.Collect();
        GC.WaitForPendingFinalizers();
        // Result: The FixedSubscriber will be collected successfully.
    }

    [MethodImpl(MethodImplOptions.NoInlining)]
    private static void SimulateMemoryLeak()
    {
        LeakySubscriber badSub = new LeakySubscriber("Bad_Sub", GlobalPublisher);
        // We set it to null and the method ends (Stack Frame popped).
        // The developer thinks the GC will clean it up...
        badSub = null!;
    }

    [MethodImpl(MethodImplOptions.NoInlining)]
    private static void SimulateFixedSubscriber()
    {
        FixedSubscriber goodSub = new FixedSubscriber("Good_Sub", GlobalPublisher);

        // Before letting the object die, we clean up the subscription
        goodSub.Dispose();

        goodSub = null!;
    }
}