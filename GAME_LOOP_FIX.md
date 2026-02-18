# Game Loop Performance Fix

The current issue is that `setPlatforms()` is being called multiple times inside `setPlayer()` callback, causing:
1. Cascading re-renders
2. Performance lag
3. Race conditions

## Solution
Use refs for game state and only update React state once per frame using a batched update pattern.
