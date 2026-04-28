namespace DotNetMemory.Section7_MemoryLeaks;

// 3. THE GOOD SUBSCRIBER (Implements IDisposable to fix the leak)
public class FixedSubscriber : IDisposable
{
    public string Name;
    private LongLivedPublisher _publisher;
    private byte[] _payload = new byte[100_000];

    public FixedSubscriber(string name, LongLivedPublisher publisher)
    {
        Name = name;
        _publisher = publisher;
        _publisher.DataChanged += OnDataChanged;
        Console.WriteLine($"   [Init] '{Name}' subscribed to Publisher.");
    }

    private void OnDataChanged(object? sender, EventArgs e) { }

    // THE FIX: Unsubscribe to cut the Root
    public void Dispose()
    {
        _publisher.DataChanged -= OnDataChanged;
        Console.WriteLine($"   [Dispose] '{Name}' unsubscribed successfully.");
    }

    ~FixedSubscriber()
    {
        Console.WriteLine($"   ---> [GC ACTION] '{Name}' is Unreachable and swept from memory!");
    }
}