namespace DotNetMemory.Section2_StackVsHeap;

// 1. This class is a Reference Type. It will be allocated on the Managed Heap.
public class User
{
    // 2. The 'Age' is a Value Type (int), BUT it lives on the HEAP!
    // Why? Because context of declaration matters. It is part of the User object's memory block.
    public int Age;

    public string? Name;

    // 3. Methods do NOT live inside the object in the Heap.
    // They live in a special shared memory area (High-Frequency Heap).
    public void Calculate()
    {
        // Under the hood, the CLR uses the MethodTable Pointer to find this method.
        // Then it passes the object's memory address as a hidden parameter called 'this'.
        Console.WriteLine($"Executing Calculate method for: {this.Name}");
    }
}