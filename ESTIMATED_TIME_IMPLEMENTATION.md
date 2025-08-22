# Estimated Time Calculation Implementation

## Overview
Successfully implemented dynamic estimated time calculation based on real API connection test response times, with real-time countdown during assessment execution.

## Implementation Details

### 1. Connection Test Response Time Capture
- **File**: `SetupWizard.tsx` (lines 32, 174-175)
- **Functionality**: During connection testing, the response time is captured and stored in `averageResponseTime` state
- **API Call**: Real connection test similar to `quick_sanity_test.py` mechanism

### 2. Estimated Time Calculation
- **File**: `SetupWizard.tsx` (lines 574-577)
- **Formula**: `response_time × total_prompts`
- **Implementation**: When setup is completed, `estimatedTimePerPrompt` is passed to Dashboard component

### 3. Initial Time Setting
- **File**: `Dashboard.tsx` (lines 293-303)
- **Functionality**: On setup completion, calculates initial estimated time and sets it in state

### 4. Real-time Updates During Execution
- **File**: `Dashboard.tsx` (lines 239-261)
- **Logic**: As each prompt is processed, recalculates remaining time based on prompts left
- **Formula**: `estimatedTimePerPrompt × (totalPrompts - currentPrompt)`

### 5. Live Countdown Timer
- **File**: `ExecutionControls.tsx` (lines 53-65)
- **Features**:
  - Real-time countdown that decreases every second
  - Only runs when assessment is active and not paused
  - Stops at 1 second minimum if assessment is still running
  - Visual indication (orange color) when time reaches 1 second

## Key Features Implemented

✅ **Real API Connection Testing**: Uses actual API response times from connection test
✅ **Dynamic Calculation**: Multiplies response time by total number of prompts
✅ **Real-time Countdown**: Visual countdown timer that updates every second
✅ **Prompt-based Updates**: Recalculates time as prompts are completed
✅ **Minimum Time Enforcement**: Never goes below 1 second
✅ **Pause/Resume Support**: Timer stops when assessment is paused
✅ **Visual Feedback**: Orange color when reaching minimum time

## Data Flow

1. **Setup Phase**: User tests connection → Response time captured
2. **Configuration**: Response time × total prompts = estimated time
3. **Execution Start**: Initial estimated time set in Dashboard
4. **During Execution**: 
   - Timer counts down every second
   - Updates based on actual prompt completion
   - Recalculates remaining time per prompt progress
5. **Completion**: Timer stops when assessment finishes

## Technical Implementation

- **State Management**: Uses React hooks for local state management
- **Timer Implementation**: `setInterval` with cleanup for real-time countdown
- **Conditional Logic**: Only runs timer when assessment is active
- **Performance**: Efficient updates with proper dependency arrays
- **Type Safety**: Full TypeScript integration with proper interfaces

## User Experience

- Users see realistic time estimates based on actual API performance
- Real-time feedback during assessment execution
- Clear visual indication when assessment is taking longer than expected
- Proper handling of pause/resume functionality

This implementation fully addresses the user's request to "record the response time when we do test connection now multiply and round off the time and keep as estimated time and as time goes keep on reducing it until last 1 or sec if progress still ain't complete leave it as such".