using System.Runtime.CompilerServices;

namespace DotNetMemory.Section6_Dispose;

// Implementing the Standard Dispose Pattern
public class NetworkSocketSimulator : IDisposable
{
    // To detect redundant calls
    private bool _disposed = false;
    public string SocketName;

    public NetworkSocketSimulator(string name)
    {
        SocketName = name;
        Console.WriteLine($"   [OS Allocation] Opened Unmanaged TCP Socket for '{SocketName}'");
    }

    // 1. THE FINALIZER (The Slow Safety Net)
    // The GC calls this if the developer FORGETS to call Dispose().
    ~NetworkSocketSimulator()
    {
        Console.WriteLine($"   ---> [FINALIZER THREAD] WARNING: GC found '{SocketName}' in Freachable Queue!");
        // false means: "I am called by the GC. Do NOT touch managed objects, only clean unmanaged ones."
        Dispose(false);
    }

    // 2. THE DISPOSE METHOD (Deterministic Cleanup)
    // The developer calls this manually (or via 'using' block).
    public void Dispose()
    {
        // true means: "I am called manually. Clean up BOTH managed and unmanaged resources."
        Dispose(true);

        // THE MAGIC LINE: 
        // Tell the GC: "I already cleaned up! Do NOT put this object in the Freachable Queue."
        GC.SuppressFinalize(this);
    }

    // 3. THE CORE CLEANUP LOGIC
    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return; // Prevent double execution

        if (disposing)
        {
            // Here you would dispose other MANAGED resources (e.g., closing a MemoryStream)
            Console.WriteLine($"   [Dispose(true)] Cleaning up MANAGED resources for '{SocketName}'...");
        }

        // Here we close the UNMANAGED resource (e.g., closing the actual OS socket handle)
        Console.WriteLine($"   [OS Cleanup] Closing Unmanaged TCP Socket for '{SocketName}'...");

        _disposed = true;
    }
}

public class DisposeDemo
{
    public static void RunDemo()
    {
        Console.WriteLine("\n=== Section 6: Dispose vs Finalizer & Unmanaged Resources ===\n");



        // SCENARIO 1: The Bad Developer (Forgetting Dispose)
        Console.WriteLine("--- Scenario 1: Relying on the Finalizer (The Bad Way) ---");
        SimulateForgottenDispose();

        Console.WriteLine("\n[Action] Forcing Garbage Collection...");
        // The GC runs, finds the object unreachable, BUT it has a Finalizer!
        // It pushes it to the 'Freachable Queue'. It survives this GC round!
        GC.Collect();

        // We MUST wait for the background Finalizer Thread to wake up and process the queue.
        GC.WaitForPendingFinalizers();


        // SCENARIO 2: The Good Developer (Using Deterministic Cleanup)
        Console.WriteLine("\n--- Scenario 2: Using IDisposable (The Good Way) ---");
        SimulateProperDispose();

        Console.WriteLine("\n[Action] Forcing Garbage Collection...");
        // The GC runs. Because we called SuppressFinalize(), the GC completely ignores the Finalizer.
        // The object is instantly swept from Gen 0 without going to the Freachable Queue!
        GC.Collect();
        GC.WaitForPendingFinalizers();
    }

    [MethodImpl(MethodImplOptions.NoInlining)]
    private static void SimulateForgottenDispose()
    {
        NetworkSocketSimulator badSocket = new NetworkSocketSimulator("Bad_Socket");
        // We finish the method WITHOUT calling badSocket.Dispose()
        // The Root is severed, but the unmanaged OS resource is STILL OPEN!
    }

    [MethodImpl(MethodImplOptions.NoInlining)]
    private static void SimulateProperDispose()
    {
        // The 'using' block is syntactic sugar for a try/finally block that calls Dispose().
        using (NetworkSocketSimulator goodSocket = new NetworkSocketSimulator("Good_Socket"))
        {
            // We do some work...
        } // <--- goodSocket.Dispose() is automatically called EXACTLY here.
    }
}