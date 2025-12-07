import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, LineSeries, AreaSeries, HistogramSeries } from 'lightweight-charts';
import { calculateSMA, calculateEMA, calculateBollingerBands, calculateRSI, calculateMACD } from '../../lib/indicators';
import { Settings, Trash2, Plus, Activity, TrendingUp, MousePointer, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

const ProfessionalChart = ({ data, lineColor = '#22c55e', topColor, bottomColor }) => {
  const { t } = useTranslation();
  const chartContainerRef = useRef(null);
  const rsiContainerRef = useRef(null);
  const macdContainerRef = useRef(null);
  
  const chartRef = useRef(null);
  const rsiChartRef = useRef(null);
  const macdChartRef = useRef(null);
  const mainSeriesRef = useRef(null);

  const [activeIndicators, setActiveIndicators] = useState([]);
  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = useState(false);
  const [activeTool, setActiveTool] = useState('cursor'); // 'cursor', 'trend', 'horizontal'
  const [drawings, setDrawings] = useState([]); // { type: 'horizontal', price: 123, id: 1 }

  // Initialize Main Chart
  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    // Cleanup
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: activeTool === 'cursor' ? 1 : 0, // Normal or Magnet
      }
    });

    const mainSeries = chart.addSeries(AreaSeries, {
      lineColor: lineColor,
      topColor: topColor,
      bottomColor: bottomColor,
      lineWidth: 2,
    });
    mainSeriesRef.current = mainSeries;

    const formattedData = data.map(([timestamp, price]) => ({
      time: timestamp / 1000,
      value: price,
    })).sort((a, b) => a.time - b.time).filter(d => d.time && !isNaN(d.value));

    if (formattedData.length > 0) {
      mainSeries.setData(formattedData);
      chart.timeScale().fitContent();
    }

    chartRef.current = chart;

    // Add Indicators (Overlays)
    if (activeIndicators.includes('SMA')) {
      const smaData = calculateSMA(formattedData, 20);
      const smaSeries = chart.addSeries(LineSeries, { color: '#fbbf24', lineWidth: 1, title: 'SMA 20' });
      smaSeries.setData(smaData);
    }
    if (activeIndicators.includes('EMA')) {
      const emaData = calculateEMA(formattedData, 20);
      const emaSeries = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1, title: 'EMA 20' });
      emaSeries.setData(emaData);
    }
    if (activeIndicators.includes('BB')) {
      const bbData = calculateBollingerBands(formattedData, 20, 2);
      const upperSeries = chart.addSeries(LineSeries, { color: 'rgba(59, 130, 246, 0.5)', lineWidth: 1, title: 'BB Upper' });
      const lowerSeries = chart.addSeries(LineSeries, { color: 'rgba(59, 130, 246, 0.5)', lineWidth: 1, title: 'BB Lower' });
      upperSeries.setData(bbData.upper);
      lowerSeries.setData(bbData.lower);
    }

    // Restore Drawings
    drawings.forEach(d => {
      if (d.type === 'horizontal') {
        mainSeries.createPriceLine({
          price: d.price,
          color: '#f97316',
          lineWidth: 2,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: 'H-Line',
        });
      }
    });

    // Click Handler for Drawing
    chart.subscribeClick((param) => {
      if (activeTool === 'horizontal' && param.point) {
        const price = mainSeries.coordinateToPrice(param.point.y);
        if (price) {
          const newDrawing = { type: 'horizontal', price, id: Date.now() };
          setDrawings(prev => [...prev, newDrawing]);
          setActiveTool('cursor'); // Reset tool after drawing
        }
      }
    });

    // Resize Handler
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, activeIndicators, lineColor, topColor, bottomColor, activeTool, drawings]); // Re-render when drawings change to apply them

  // Initialize RSI Chart
  useEffect(() => {
    if (!activeIndicators.includes('RSI') || !rsiContainerRef.current || !data) return;
    
    if (rsiChartRef.current) {
      rsiChartRef.current.remove();
      rsiChartRef.current = null;
    }

    const rsiChart = createChart(rsiContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#9ca3af' },
      grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } },
      width: rsiContainerRef.current.clientWidth,
      height: 150,
      timeScale: { visible: false },
    });

    const rsiSeries = rsiChart.addSeries(LineSeries, { color: '#818cf8', lineWidth: 1, title: 'RSI 14' });
    const formattedData = data.map(([timestamp, price]) => ({ time: timestamp / 1000, value: price })).sort((a, b) => a.time - b.time).filter(d => d.time && !isNaN(d.value));
    const rsiData = calculateRSI(formattedData, 14);
    rsiSeries.setData(rsiData);

    // Sync TimeScale
    if (chartRef.current) {
      chartRef.current.timeScale().subscribeVisibleLogicalRangeChange(range => {
        rsiChart.timeScale().setVisibleLogicalRange(range);
      });
    }

    rsiChartRef.current = rsiChart;
    return () => { if (rsiChartRef.current) { rsiChartRef.current.remove(); rsiChartRef.current = null; } };
  }, [activeIndicators, data]);

  // Initialize MACD Chart
  useEffect(() => {
    if (!activeIndicators.includes('MACD') || !macdContainerRef.current || !data) return;
    
    if (macdChartRef.current) {
      macdChartRef.current.remove();
      macdChartRef.current = null;
    }

    const macdChart = createChart(macdContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#9ca3af' },
      grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } },
      width: macdContainerRef.current.clientWidth,
      height: 150,
      timeScale: { visible: false },
    });

    const macdSeries = macdChart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1, title: 'MACD' });
    const signalSeries = macdChart.addSeries(LineSeries, { color: '#f97316', lineWidth: 1, title: 'Signal' });
    const histogramSeries = macdChart.addSeries(HistogramSeries, { color: '#22c55e' });

    const formattedData = data.map(([timestamp, price]) => ({ time: timestamp / 1000, value: price })).sort((a, b) => a.time - b.time).filter(d => d.time && !isNaN(d.value));
    const macdData = calculateMACD(formattedData);
    
    macdSeries.setData(macdData.macdLine);
    signalSeries.setData(macdData.signalLine);
    histogramSeries.setData(macdData.histogram);

    // Sync TimeScale
    if (chartRef.current) {
      chartRef.current.timeScale().subscribeVisibleLogicalRangeChange(range => {
        macdChart.timeScale().setVisibleLogicalRange(range);
      });
    }

    macdChartRef.current = macdChart;
    return () => { if (macdChartRef.current) { macdChartRef.current.remove(); macdChartRef.current = null; } };
  }, [activeIndicators, data]);

  const toggleIndicator = (ind) => {
    setActiveIndicators(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]);
  };

  const clearDrawings = () => {
    setDrawings([]);
  };

  return (
    <div className="relative flex h-full">
      {/* Drawing Toolbar (Left) */}
      <div className="w-10 border-r border-gray-800 flex flex-col items-center py-2 space-y-2 bg-gray-900/50">
        <button 
          className={clsx("p-2 rounded hover:bg-gray-800 text-gray-400 hover:text-white", activeTool === 'cursor' && "bg-gray-800 text-white")}
          onClick={() => setActiveTool('cursor')}
          title={t('chart.cursor')}
        >
          <MousePointer size={16} />
        </button>
        <button 
          className={clsx("p-2 rounded hover:bg-gray-800 text-gray-400 hover:text-white", activeTool === 'trend' && "bg-gray-800 text-white")}
          onClick={() => setActiveTool('trend')}
          title={`${t('chart.trend_line')} (${t('chart.coming_soon')})`}
          disabled
        >
          <TrendingUp size={16} className="opacity-50" />
        </button>
        <button 
          className={clsx("p-2 rounded hover:bg-gray-800 text-gray-400 hover:text-white", activeTool === 'horizontal' && "bg-gray-800 text-white")}
          onClick={() => setActiveTool('horizontal')}
          title={t('chart.horizontal_line')}
        >
          <Minus size={16} />
        </button>
        {drawings.length > 0 && (
          <button 
            className="p-2 rounded hover:bg-red-900/50 text-red-400 hover:text-red-200 mt-auto"
            onClick={clearDrawings}
            title={t('chart.clear_drawings')}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Chart Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Toolbar */}
        <div className="h-10 border-b border-gray-800 flex items-center px-4 space-x-4 bg-gray-900/30">
          <button 
            className="flex items-center text-xs font-medium text-gray-400 hover:text-white"
            onClick={() => setIsIndicatorModalOpen(!isIndicatorModalOpen)}
          >
            <Activity size={14} className="mr-1" /> {t('chart.indicators')}
          </button>
          {/* Active Indicators List */}
          <div className="flex space-x-2">
            {activeIndicators.map(ind => (
              <span key={ind} className="flex items-center text-[10px] bg-gray-800 px-2 py-0.5 rounded text-blue-400">
                {ind} <button onClick={() => toggleIndicator(ind)} className="ml-1 hover:text-white"><Trash2 size={10} /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Indicator Selection Modal */}
        {isIndicatorModalOpen && (
          <div className="absolute top-10 left-4 z-20 w-48 bg-gray-800 border border-gray-700 rounded shadow-xl p-2">
            <div className="text-xs font-bold text-gray-500 mb-2 px-2">{t('chart.overlays')}</div>
            <button onClick={() => toggleIndicator('SMA')} className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-gray-700 rounded">{t('chart.sma')}</button>
            <button onClick={() => toggleIndicator('EMA')} className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-gray-700 rounded">{t('chart.ema')}</button>
            <button onClick={() => toggleIndicator('BB')} className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-gray-700 rounded">{t('chart.bb')}</button>
            <div className="text-xs font-bold text-gray-500 mt-2 mb-2 px-2">{t('chart.oscillators')}</div>
            <button onClick={() => toggleIndicator('RSI')} className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-gray-700 rounded">{t('chart.rsi')}</button>
            <button onClick={() => toggleIndicator('MACD')} className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-gray-700 rounded">{t('chart.macd')}</button>
          </div>
        )}

        {/* Main Chart */}
        <div className="flex-1 relative" ref={chartContainerRef}></div>
        
        {/* Indicator Panes */}
        {activeIndicators.includes('RSI') && (
          <div className="h-[150px] border-t border-gray-800 relative" ref={rsiContainerRef}></div>
        )}
        {activeIndicators.includes('MACD') && (
          <div className="h-[150px] border-t border-gray-800 relative" ref={macdContainerRef}></div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalChart;