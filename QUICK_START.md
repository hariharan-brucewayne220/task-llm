# 🚀 Quick Start Guide

## **Fixed Issues:**
✅ **Date Format Hydration Mismatch** - Fixed with consistent en-US formatting  
✅ **Missing Heroicons** - Fixed TrendingUpIcon/TrendingDownIcon imports  
✅ **WebSocket Connection** - Made gracefully fail when backend not running  

---

## **Start the Complete System:**

### **Option 1: Full System (Recommended)**
```bash
# Terminal 1: Start WebSocket Backend
source red_team_env/Scripts/activate
python websocket_server.py

# Terminal 2: Start Frontend Dashboard  
cd dashboard
npm run dev
```

### **Option 2: Frontend Only (For UI Demo)**
```bash
# Just the dashboard (WebSocket will show connection error but work)
cd dashboard  
npm run dev
```

---

## **System Status:**

### **✅ Fixed & Working:**
- **4-Step Setup Flow**: Provider → Model → API → Validation → Configure
- **Real-time Dashboard**: Live updates via WebSocket
- **Scheduled Assessments**: Create recurring tests
- **Historical Comparison**: Track improvements over time
- **PDF Export**: Complete assessment reports
- **All 5 Attack Categories**: Jailbreak, Bias, Hallucination, Privacy, Manipulation

### **🔗 URLs:**
- **Dashboard**: http://localhost:3000
- **WebSocket Server**: http://localhost:5000
- **WebSocket Endpoint**: ws://localhost:5000

### **📊 Features:**
- **Multi-Provider Support**: OpenAI, Anthropic, Google
- **Real-time Progress**: Live test execution monitoring  
- **Advanced Metrics**: BLEU, Sentiment, Vulnerability scoring
- **Professional UI**: Enterprise-grade interface
- **Integration Ready**: API endpoints for external systems

---

## **Demo Flow:**
1. Navigate to http://localhost:3000
2. Click "🚀 New Assessment"
3. **Step 1**: Select OpenAI (7 models available)
4. **Step 2**: Choose gpt-4o-mini + enter API key
5. **Step 3**: Test connection (validates API)
6. **Step 4**: Configure categories + launch
7. Monitor real-time execution
8. View comprehensive results
9. Export PDF report

**All hydration errors fixed - dashboard should load cleanly now!** ✨