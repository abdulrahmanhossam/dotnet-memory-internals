using System;
using System.Runtime.InteropServices;
using System.Runtime.CompilerServices;

namespace DotNetMemory.Section3_GCRoots;

// A simple class to represent an object on the Managed Heap
public class DummyNode
{
    public string? NodeName;

    // We add a Finalizer (Destructor) ONLY for the live demo.
    // It prints a message right before the GC actually destroys the object from the Heap.
    ~DummyNode()
    {
        Console.WriteLine($"   ---> [GC ACTION] {NodeName} is Unreachable! Destroying and sweeping from memory.");
    }
}

public class GcRootsDemo
{
    // 1. STATIC ROOT: This reference lives in a special High-Frequency Heap area.
    // It acts as a permanent Root. The GC will NEVER collect what it points to.
    public static DummyNode? StaticRootNode;

    public static void RunDemo()
    {
        Console.WriteLine("\n=== Section 3: GC Roots & Reachability ===\n");

        // 2. STATIC ROOT
        StaticRootNode = new DummyNode { NodeName = "Static_Root_Node" };
        Console.WriteLine("[Mark] Created Static Root Node.");

        // 3. GC HANDLE (Pinned Root for Unmanaged OS Interaction)
        // In real systems, we pin raw 'blittable' data buffers (like byte arrays) to share with Native/OS code.
        byte[] unmanagedBuffer = new byte[1024];
        GCHandle handle = GCHandle.Alloc(unmanagedBuffer, GCHandleType.Pinned);
        Console.WriteLine("[Mark] Created Pinned GC Handle for a raw byte array buffer.");

        // 4. STACK ROOT LIFECYCLE DEMO
        // We call the method to test its lifecycle. Attempt 1 will happen INSIDE this method.
        RunStackRootLifecycle();

        // At this point, RunStackRootLifecycle() has finished.
        // The Stack Frame is completely destroyed (Popped), so the Root is severed.
        Console.WriteLine("\n[Action] The Stack Root method has finished. The Stack frame is popped!");
        Console.WriteLine("[Action] Forcing Garbage Collection (Attempt 2 - Outside the method)...");

        // This time, the GC will realize the Stack Node has no active Roots pointing to it.
        GC.Collect();
        GC.WaitForPendingFinalizers();
        // Result: The GC will sweep "Stack_Root_Node" and print the Finalizer message.

        // Clean up the handle before exiting to avoid OS resource leaks
        handle.Free();
    }

    // We use [MethodImpl(MethodImplOptions.NoInlining)] to prevent the JIT Compiler 
    // from merging this method into RunDemo. This guarantees a separate Stack Frame!
    [MethodImpl(MethodImplOptions.NoInlining)]
    private static void RunStackRootLifecycle()
    {
        DummyNode stackNode = new DummyNode { NodeName = "Stack_Root_Node" };
        Console.WriteLine("[Mark] Created Stack Root Node inside a temporary method.");

        Console.WriteLine("\n[Action] Forcing Garbage Collection (Attempt 1 - Inside the method)...");
        // The GC runs, but it SEES 'stackNode' is still in the active Stack frame.
        // It marks it as REACHABLE. Nothing gets destroyed!
        GC.Collect();
        GC.WaitForPendingFinalizers();

        Console.WriteLine("   ---> [Result] Attempt 1 finished. No GC Action because the Root is still ALIVE in the Stack!");
        // When we reach this bracket, the method ends. 
        // The 'stackNode' variable is popped from the Stack.
    }
}