# Chart.js Dependencies Installation

To enable the model comparison charts in the dashboard, run the following command in the dashboard directory:

```bash
cd dashboard
npm install chart.js@^4.4.0 react-chartjs-2@^5.2.0 chartjs-adapter-date-fns@^3.0.0 date-fns@^2.30.0
```

## What's Included

The model comparison feature provides:

### 📊 **Interactive Chart Types**
- **Bar Charts** - Safeguard success rates, vulnerability scores
- **Line Charts** - Performance metrics over time  
- **Radar Charts** - Category performance comparison
- **Stacked Bar Charts** - Risk distribution analysis
- **Multi-axis Charts** - Response time vs response length

### 🎯 **Comparison Metrics**
1. **Safeguards** - Success rate comparison across models
2. **Vulnerability** - Overall vulnerability scoring
3. **Performance** - Response time and length analysis
4. **Risk Distribution** - Low/Medium/High/Critical breakdown
5. **Categories** - Radar chart for 5 vulnerability categories
6. **Advanced Metrics** - BLEU/Sentiment/Consistency (when available)

### ✨ **Features**
- **Real-time Updates** - Charts update as assessments complete
- **Interactive Switching** - Toggle between different chart views
- **Color-coded Models** - Each model gets unique colors
- **Summary Cards** - Quick stats for each model
- **Responsive Design** - Works on all screen sizes

### 🔄 **Data Flow**
```
Assessment Complete → Model Data Extracted → Chart Data Updated → UI Refreshes
```

The charts automatically populate when you run assessments on different models. Up to 5 models are retained for comparison.