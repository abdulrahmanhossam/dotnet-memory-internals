namespace DotNetMemory.Section7_MemoryLeaks;

// 2. THE BAD SUBSCRIBER (Causes Logical Memory Leak)
public class LeakySubscriber
{
    public string Name;
    // 100 KB payload to make the leak noticeable
    private byte[] _payload = new byte[100_000];

    public LeakySubscriber(string name, LongLivedPublisher publisher)
    {
        Name = name;
        // THE TRAP: The Publisher now holds a STRONG REFERENCE to this Subscriber!
        publisher.DataChanged += OnDataChanged;
        Console.WriteLine($"   [Init] '{Name}' subscribed to Publisher.");
    }

    private void OnDataChanged(object? sender, EventArgs e) { }

    ~LeakySubscriber()
    {
        Console.WriteLine($"   ---> [GC ACTION] '{Name}' is Unreachable and swept from memory!");
    }
}