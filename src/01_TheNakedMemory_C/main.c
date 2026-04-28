// File: main.c
#include <stdio.h>
#include <stdlib.h>

int main() {
    printf("1. Hello from the CPU!\n");

    // size of memory we allcoated
    int size = 1024; // 1 KB
    // Virtual Address 
    void* os_memory_block = malloc(size);

    printf("2. OS allocated %d bytes at Virtual Address: %p\n", size, os_memory_block);

    // if we forget this -> (Memory Leak)
    free(os_memory_block);
    printf("3. Memory freed manually.\n");

    return 0;
}