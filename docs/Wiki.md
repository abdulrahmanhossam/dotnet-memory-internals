# .NET Memory Management Internals

A comprehensive reference for understanding the .NET memory management system, Garbage Collector internals, and common memory-related pitfalls in managed code.

## Table of Contents

1. [OS Memory and Compilation](#1-os-memory-and-compilation)
2. [Stack vs Managed Heap](#2-stack-vs-managed-heap)
3. [Garbage Collection and Reachability](#3-garbage-collection-and-reachability)
4. [Generational GC Hypothesis](#4-generational-gc-hypothesis)
5. [Large Object Heap](#5-large-object-heap)
6. [Deterministic Cleanup](#6-deterministic-cleanup)
7. [Logical Memory Leaks](#7-logical-memory-leaks)

---

## 1. OS Memory and Compilation

### Physical vs Virtual Memory Abstraction

Modern operating systems provide each process with a **virtual address space** that is isolated from other processes and mapped to physical RAM through the Memory Management Unit (MMU). In C/C++, memory allocation directly invokes the OS kernel via system calls (`malloc` -> `brk`/`mmap` -> `syscall`) to reserve virtual pages.

### The Naked Memory Model

Without a managed runtime, C programs allocate memory at the granularity of bytes. The developer bears full responsibility for:

- Allocation via `malloc()`, `calloc()`, or `realloc()`
- Deallocation via `free()`
- Prevention of use-after-free and double-free bugs
- Manual alignment and padding calculations

### Compilation Pipeline

```c
// main.c - Native C memory allocation
#include <stdlib.h>

int main() {
    int* numbers = (int*)malloc(10 * sizeof(int));  // OS syscalls: brk/mmap
    numbers[0] = 42;
    free(numbers);                                   // Returns pages to OS
    return 0;
}
```

```
gcc main.c -o main          // Compilation: source -> assembly -> object
./main                      // Execution: direct memory manipulation, no runtime
```

**Key Difference**: Native C has no safety net. Buffer overruns corrupt adjacent memory silently. The .NET runtime substitutes this raw model with a **Garbage Collector** that automates deallocation.

---

## 2. Stack vs Managed Heap

### Thread Stack: O(1) Allocation

The **Thread Stack** is a pre-allocated memory region (typically 1MB per thread) that grows downward. Allocating space is merely subtracting from the stack pointer (SP):

```asm
; x86_64 assembly equivalent
sub rsp, 32       ; Allocate 32 bytes on stack in O(1)
; ... use stack space ...
add rsp, 32       ; Deallocate by restoring SP
```

**Value Types** (primitives, structs, and pointers) live on the stack. When a method returns, its stack frame is immediately invalidated—no traversal required.

### Managed Heap: Contiguous Block Allocation

The **Managed Heap** is a large virtual memory region managed by the .NET GC. Allocation works by advancing a **next object pointer** (bump pointer):

```csharp
// C# - Managed heap allocation
public class Person {
    public string Name;
    public int Age;
}

void AllocatePerson() {
    var p = new Person { Name = "Alice", Age = 30 };
    // 1. Calculate object size (fields + Object Header + MethodTable pointer)
    // 2. Advance next object pointer by size
    // 3. Return reference at new position
}
```

### Object Structure in Memory

Every managed object begins with two mandatory pointers:

| Offset | Field | Description |
|--------|-------|-------------|
| -8 | **Sync Block Index** | Used for locking, boxing, and interop |
| 0 | **MethodTable Pointer** | Pointer to the type's metadata (RTTI) |
| +8 | **Object Data** | Instance fields begin here |

```
[Sync Block Index (8 bytes)][MethodTable Pointer (8 bytes)][Field 1][Field 2]...
```

**Note**: The MethodTable pointer enables runtime type identification, reflection, and virtual dispatch—capabilities unavailable in unmanaged C.

---

## 3. Garbage Collection and Reachability

### Tracing GC: Graph Traversal

.NET uses a **tracing garbage collector**. The GC does not track individual objects; it traverses the **object graph** starting from **GC Roots**, marking all reachable objects as live. Unreached objects are considered garbage.

```
GC Roots (static, stack, registers)
     │
     ▼
 [Object A] ───► [Object B]
     │               │
     ▼               ▼
 [Object C]     [Object D]  ◄── Unreachable → Collected
```

### GC Roots: The Definitive List

The following are **absolute GC roots** in .NET:

1. **Stack Variables**: Local variables and parameters in managed frames
2. **Static Fields**: `static` class fields marked for the AppDomain lifetime
3. **CPU Registers**: Managed pointers held in CPU registers during JIT compilation
4. **Pinned Handles**: `GCHandle.Alloc(obj, GCHandleType.Pinned)` prevents heap compaction

```csharp
// Static root example
public class Cache {
    public static Dictionary<string, Person> GlobalCache = new();
}
// GlobalCache is a GC root for the lifetime of the AppDomain
```

```csharp
// Pinned handle example - required for interop with native code
[DllImport("native.dll")]
static extern void ProcessBuffer(byte[] data);

void ProcessWithPinning() {
    var buffer = new byte[1024];
    var handle = GCHandle.Alloc(buffer, GCHandleType.Pinned);
    var ptr = handle.AddrOfPinnedObject();
    ProcessBuffer(buffer);
    handle.Free();
}
```

**Warning**: Pinned objects inhibit heap compaction and can cause **heap fragmentation**. Use `fixed` blocks only when interfacing with native code.

---

## 4. Generational GC Hypothesis

### The Weak Generational Hypothesis

The .NET GC is built on the **Weak Generational Hypothesis**: most objects die young.

- **Gen 0 (Playground)**: Newly allocated objects. High turnover.
- **Gen 1 (Buffer)**: Objects that survived a Gen 0 collection.
- **Gen 2 (Retirement Home)**: Long-lived objects that survived Gen 1.

### Object Promotion

```
Allocation → Gen 0 → [GC occurs] → Survivors → Gen 1 → [GC occurs] → Survivors → Gen 2
                   Die              Die
```

An object promoted to Gen 2 remains there until it becomes unreachable.

### GC Heap Segments

- **Ephemeral Generations (Gen 0/1)**: Share a single memory segment. Collection triggers heap contraction.
- **Gen 2**: Separate segment(s). Collection does not contract; memory is retained for reuse.

```csharp
// Gen 0 allocation - short-lived
void Gen0Example() {
    var temp = new byte[1024];  // Allocated in Gen 0
    // If no references after this method → Gen 0 collection
}

// Gen 2 allocation - long-lived
public static readonly List<byte> PersistentCache = new();
void Gen2Example() {
    PersistentCache.Add(0xFF); // Added in Gen 2, survives until AppDomain unload
}
```

**Note**: The GC triggers Gen 0 collections frequently (allocations exceed threshold), Gen 1 less frequently, and Gen 2 rarely.

---

## 5. Large Object Heap

### Threshold: 85,000 Bytes

Objects requiring **85,000 or more bytes** are allocated directly on the **Large Object Heap (LOH)**, bypassing Gen 0/1 ephemeral generations.

```csharp
// LOH allocation
void AllocateLarge() {
    var largeBuffer = new byte[85_000];  // Allocated on LOH directly
    // Objects >= 85KB use LOH, regardless of type
}
```

### No Compaction

The LOH is **not compacted** by default. Free blocks between live large objects accumulate, fragmenting the heap.

### The Fragmentation Danger

```
Before: [Live Block 100KB][Free 2MB][Live Block 90KB]
After:  [Live Block 100KB][Live Block 90KB][Free 2MB]  ← Compacted on Gen 0/1

LOH (no compaction):
Before: [Live Block 100KB][Free 2MB][Live Block 90KB]
After:  [Live Block 100KB][Free 2MB][Live Block 90KB]  ← Fragmentation persists
```

Repeated LOH allocations without collection can exhaust virtual address space, triggering **OutOfMemoryException**.

**Warning**: The LOH does not collect free blocks until a Gen 2 collection occurs. Monitor LOH usage in production systems.

```csharp
// Force LOH compaction (requires .NET Core 3.0+)
GCSettings.LargeObjectHeapCompactionMode = GCLargeObjectHeapCompactionMode.CompactOnce;
GC.Collect();
```

---

## 6. Deterministic Cleanup

### Unmanaged Resources

Managed objects wrapping unmanaged resources (file handles, database connections, native memory) require explicit cleanup:

1. **Native memory**: `Marshal.AllocHGlobal` / `Marshal.FreeHGlobal`
2. **File handles**: `SafeFileHandle` / `FileStream.Dispose`
3. **Native DLL handles**: `FreeLibrary`

### Finalizers: The Heavy Cost

Declaring a `~ destructor` (Finalizer) queues the object for **finalization**:

1. Object becomes unreachable
2. GC detects finalizable object
3. Object enqueued to **Freachable Queue**
4. Finalizer thread executes `~TypeName()` asynchronously
5. Object collected in next Gen 0/1

```csharp
// Finalizer example - expensive
public class NativeBuffer : IDisposable {
    private IntPtr _buffer;

    public NativeBuffer(int size) {
        _buffer = Marshal.AllocHGlobal(size);
    }

    ~NativeBuffer() {  // Executed by finalizer thread, unpredictable timing
        Marshal.FreeHGlobal(_buffer);  // Relies on GC to call this
    }

    public void Dispose() {
        Marshal.FreeHGlobal(_buffer);
        GC.SuppressFinalize(this);  // Critical: prevent double-cleanup
    }
}
```

### The IDisposable Pattern

```csharp
public class ManagedResource : IDisposable {
    private bool _disposed = false;

    public void Dispose() {
        if (!_disposed) {
            // Release unmanaged resources
            // Release managed resources
            _disposed = true;
        }
        GC.SuppressFinalize(this);  // Bypass finalizer queue
    }
}
```

**Note**: `GC.SuppressFinalize(this)` prevents the finalizer from running, saving the overhead of queue traversal and thread scheduling.

**Warning**: Finalizers increase GC pause times significantly. Avoid finalizers; prefer `IDisposable` with explicit `Dispose()` calls or `using` statements.

```csharp
// Deterministic cleanup via using statement
using (var file = new StreamWriter("data.txt")) {
    file.Write("data");
} // Dispose() called automatically
```

---

## 7. Logical Memory Leaks

### Unreachable Business Logic

A **logical memory leak** occurs when objects remain reachable to the GC but are no longer useful to the application:

- Business logic state that accumulates indefinitely
- Caches without eviction policies
- Event subscriptions not unsubscribed

### The Event Subscription Trap

Subscribing to an event creates a **strong reference** from the publisher's `MulticastDelegate` to the subscriber's instance:

```csharp
// Event leak example
public class Publisher {
    public event Action OnClick;
}

public class Subscriber {
    public Publisher Publisher;
    public void HandleClick() { /* ... */ }

    public void Subscribe() {
        Publisher.OnClick += HandleClick;  // Strong reference held by Publisher
    }
}

// Problem: If Subscriber forgets to unsubscribe,
// the reference persists for the lifetime of Publisher
```

### Fix: Unsubscribe on Cleanup

```csharp
public class Subscriber : IDisposable {
    public Publisher Publisher;
    private bool _disposed = false;

    public void HandleClick() { /* ... */ }

    public void Subscribe() {
        Publisher.OnClick += HandleClick;
    }

    public void Dispose() {
        if (!_disposed) {
            Publisher.OnClick -= HandleClick;  // Remove strong reference
            _disposed = true;
        }
    }
}
```

**Note**: Use **weak event patterns** (`System.ComponentModel.WeakEventManager`) for pub/sub systems where subscribers may be long-lived.

### Additional Leak Patterns

| Pattern | Cause | Fix |
|---------|-------|-----|
| Static collections | Grow indefinitely | Implement size limits/eviction |
| Dictionary caches | Keys never removed | Add TTL or LRU eviction |
| Event handlers | No unsubscription | Unsubscribe in `Dispose()` |
| Reflection caching | Metadata stored forever | Use weak references |

---

## References

- [Microsoft Docs: Garbage Collection Fundamentals](https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/)
- [Maoni Stephens: .NET GC Internals](https://devblogs.microsoft.com/dotnet/garbage-collection/)
- [Cnblogs: CLR via C# ( Jeffrey Richter)]

---

Authored by Abdulrahman Hossam - Software Engineer