using DotNetMemory.Section2_StackVsHeap;
using DotNetMemory.Section3_GCRoots;
using DotNetMemory.Section4_Generations;
using DotNetMemory.Section5_LOH;
using DotNetMemory.Section6_Dispose;
using DotNetMemory.Section7_MemoryLeaks;

class Program
{
    static void Main()
    {
        #region Section 2: Stack vs Heap & Memory Layout

        Console.WriteLine("=== Section 2: Stack vs Heap & Copy Behaviors ===\n");

        // ==========================================
        // 1. Copy by Value (Stack Operations)
        // ==========================================
        // 'x' is allocated on the Thread's local Stack. Allocation is O(1) fast.
        int x = 5;

        // The system creates a completely NEW space on the Stack and copies the actual value '5'.
        int y = x;

        // Modifying 'y' has absolutely NO effect on 'x'. They are isolated.
        y = 10;

        Console.WriteLine($"[Copy by Value] x: {x}, y: {y}");


        // ==========================================
        // 2. Copy by Reference (Heap Allocation)
        // ==========================================
        // The actual User object (data) is allocated on the Managed Heap.
        // 'u1' is just a Pointer living on the Stack, pointing to the Heap address.
        User u1 = new User { Name = "Abdulrahman Hossam", Age = 25 };

        // We are NOT copying the object. We are only copying the Memory Address!
        // Now, both 'u1' and 'u2' on the Stack point to the exact same object in the Heap.
        User u2 = u1;

        // Modifying via 'u2' will affect 'u1' because they share the same reference.
        u2.Name = "Ali";

        Console.WriteLine($"[Copy by Reference] u1 Name: {u1.Name}, u2 Name: {u2.Name}");


        // ==========================================
        // 3. Object Memory Layout (Fields vs Methods)
        // ==========================================

        // The 'Age' field is 4 bytes living INSIDE the User object on the HEAP, not the Stack.
        u1.Age = 26;

        // When calling Calculate(), the CLR looks at the 'MethodTable Pointer' in the object header.
        // It locates the method and secretly passes the 'u1' address as the 'this' parameter.
        u1.Calculate();

        #endregion

        #region Section 3: GC Roots & Reachability

        // Execute the GC Roots Demo
        GcRootsDemo.RunDemo();

        #endregion

        #region Section 4: Generational GC & LOH

        GenerationsDemo.RunDemo();

        #endregion

        #region Section 5: LOH & Memory Fragmentation

        LohDemo.RunDemo();

        #endregion

        #region Section 6: Dispose vs Finalizer

        DisposeDemo.RunDemo();

        #endregion

        #region Section 7: Logical Memory Leaks

        MemoryLeaksDemo.RunDemo();

        #endregion

        Console.ReadLine();
    }
}
