# .NET Memory Internals

A practical laboratory for understanding .NET Memory Management Internals and Garbage Collection. This repository provides hands-on examples covering memory allocation at the OS level, managed heap vs stack, GC roots, generational garbage collection, Large Object Heap (LOH), the Dispose pattern, and logical memory leaks.

## Lab Contents

1. **OS Memory (The Naked Memory)** - Physical vs virtual memory; raw C allocation
2. **Stack vs Heap** - Memory allocation mechanics in native C vs managed .NET
3. **GC Roots** - Understanding object reachability and root references
4. **Generational GC** - Generations 0, 1, and 2; short-lived vs long-lived objects
5. **Large Object Heap (LOH)** - Objects >= 85KB and memory allocation
6. **Dispose Pattern** - Explicit resource disposal and `IDisposable`
7. **Memory Leaks** - Logical leaks in managed code

## Repository Structure

```
.
├── .gitignore                    # Git ignore rules
├── README.md                     # This file
├── LICENSE                       # MIT License
├── src/
│   ├── 01_TheNakedMemory_C/     # Native C memory allocation lab
│   └── 02_DotNetMemory_CSharp/ # .NET C# console application
└── docs/
    ├── images/                 # Documentation images
    └── Wiki.md                 # Comprehensive Wiki article
```

- `src/` contains both the C project (demonstrating OS-level memory) and the C# .NET project.
- `docs/` stores visual references, diagrams, and the [Wiki](docs/Wiki.md) article.
- `.gitignore` is located in the C# project directory.

## Prerequisites

### Linux (Ubuntu or equivalent)
- .NET SDK (8.0 or later recommended)
- GCC compiler (`sudo apt install gcc`)

### Windows
- .NET SDK (8.0 or later recommended)
- Visual Studio with C++ desktop development workload OR MinGW-w64

## How to Run

Navigate to the C# project directory and run:

```bash
cd src/02_DotNetMemory_CSharp/DotNetMemory
dotnet run -c Release
```

Always use `dotnet run -c Release` to ensure accurate GC behavior, as the Debug configuration may include additional JIT optimizations that interfere with memory observations.

## Contribution

Improvements are welcome. Fork the repository, create a feature branch, and submit a pull request with clear descriptions of changes.

---

Developed by Abdulrahman Hossam - Software Engineer