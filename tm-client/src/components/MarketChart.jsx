import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

const MarketChart = ({ data = [], isBurst = false }) => {
  const series = [{
    name: 'Sensex',
    data: data.slice(-50) // Last 50 points
  }];

  const options = {
    chart: {
      type: 'area',
      height: 350,
      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: {
          speed: 500
        }
      },
      toolbar: { show: false },
      background: 'transparent'
    },
    colors: [isBurst ? '#f43f5e' : '#6366f1'],
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 3,
      colors: [isBurst ? '#f43f5e' : '#6366f1']
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 100]
      }
    },
    grid: {
      borderColor: 'rgba(255,255,255,0.05)',
      strokeDashArray: 4
    },
    xaxis: {
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { colors: 'rgba(255,255,255,0.4)', fontSize: '10px' },
        formatter: (val) => val.toFixed(0)
      },
      tooltip: { enabled: true }
    },
    tooltip: {
      theme: 'dark',
      x: { show: false }
    }
  };

  return (
    <div className="w-full h-full min-h-[300px] glass-card rounded-3xl p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isBurst ? 'bg-danger animate-ping' : 'bg-primary'}`} />
            <h3 className="text-sm font-semibold text-white/60">SENSEX REAL-TIME</h3>
        </div>
        <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Quantum Telemetry</span>
      </div>
      <ReactApexChart options={options} series={series} type="area" height="100%" />
    </div>
  );
};

export default MarketChart;
