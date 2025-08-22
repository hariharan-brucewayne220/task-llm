# System Verification Guide - Step by Step

## 🎯 Current Status
✅ WebSocket server is running  
✅ Dashboard is connected  
❓ Need to create and run an actual assessment

## 📋 Step-by-Step Verification

### Step 1: Verify All Services Are Running

**Check these URLs in your browser:**
- 🌐 **Dashboard**: http://localhost:3000 (should show the dashboard)
- 🔌 **WebSocket**: http://localhost:5000 (should show "WebSocket Connected" in dashboard)
- 🖥️ **Backend API**: http://localhost:5000/api/assessments (should show JSON response)

### Step 2: Create a Test Assessment

**Option A: Using the Dashboard (Recommended)**
1. Go to http://localhost:3000
2. Look for "Create Assessment" or "New Assessment" button
3. Fill in:
   - Name: "Test Assessment"
   - Provider: "OpenAI" 
   - Model: "gpt-3.5-turbo"
   - Categories: Select all (jailbreak, bias, etc.)

**Option B: Using API Directly**
```bash
curl -X POST http://localhost:5000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Assessment",
    "description": "Live test assessment",
    "llm_provider": "openai", 
    "model_name": "gpt-3.5-turbo",
    "test_categories": ["jailbreak", "bias", "hallucination"]
  }'
```

### Step 3: Start the Assessment

**After creating assessment, you should see:**
- Assessment ID (e.g., ID: 1)
- "Start Assessment" button
- Click it to begin testing

### Step 4: Watch Real-Time Updates

**In the dashboard, you should see:**
- ✅ Progress bar moving (e.g., "Testing prompt 2/15")
- ✅ Live test results appearing
- ✅ Vulnerability alerts for high-risk findings
- ✅ Response times and safeguard status

### Step 5: Verify Complete Assessment

**When finished, check:**
- ✅ Status shows "Completed"
- ✅ Final metrics displayed
- ✅ Strengths/Weaknesses analysis
- ✅ Export options available

## 🔧 Quick Test Commands

### Test Backend API
```bash
# List assessments
curl http://localhost:5000/api/assessments

# Check WebSocket connection
curl http://localhost:5000/socket.io/
```

### Test Frontend
```bash
# Should return the dashboard HTML
curl http://localhost:3000
```

## 🐛 Troubleshooting

### Dashboard Shows "API Not Tested"
**Solution**: Create and run an assessment (Steps 2-3 above)

### WebSocket Not Connected  
**Solution**: Restart websocket_server.py

### Backend API Errors
**Solution**: Start the Flask backend:
```bash
cd llm-redteam-platform/backend
python run.py
```

### No Progress Updates
**Solution**: Check that all services are running and assessment is actually started

## ✅ Success Indicators

**You'll know everything is working when you see:**
1. 🔄 Progress bar moving in real-time
2. 📝 Test results appearing as they complete  
3. 🛡️ Safety filter outcomes displayed
4. 📊 Live metrics updating
5. ⚠️ Vulnerability alerts for high-risk findings

## 🚀 Quick Demo Script

Run this to automatically test everything:
```bash
python run_complete_demo.py
```

This will:
- Start all services
- Create a test assessment  
- Run live testing with real APIs
- Show real-time dashboard updates

---

**Goal**: See live red team testing in action with real API calls and real-time dashboard updates! 🎯