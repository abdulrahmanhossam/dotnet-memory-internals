namespace DotNetMemory.Section7_MemoryLeaks;

// 1. THE PUBLISHER (Long-lived Object)
public class LongLivedPublisher
{
    // The Event backing field is essentially a MulticastDelegate (a List of references)
    public event EventHandler? DataChanged;

    public void SimulateActivity() => DataChanged?.Invoke(this, EventArgs.Empty);
}