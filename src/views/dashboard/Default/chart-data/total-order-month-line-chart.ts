interface LineChartData {
  type: string;
  height: number;
  options: {
    chart: {
      sparkline: {
        enabled: boolean;
      };
    };
    dataLabels: {
      enabled: boolean;
    };
    colors: string[];
    fill: {
      type: string;
      opacity: number;
    };
    stroke: {
      curve: string;
      width: number;
    };
    yaxis: {
      min: number;
      max: number;
      labels: {
        show: boolean;
      };
    };
    tooltip: {
      fixed: {
        enabled: boolean;
      };
      x: {
        show: boolean;
      };
      y: {
        title: {
          formatter: (seriesName: string) => string;
        };
      };
      marker: {
        show: boolean;
      };
    };
  };
  series: Array<{
    name: string;
    data: number[];
  }>;
}

// ==============================|| DASHBOARD - TOTAL ORDER MONTH CHART ||============================== //

const chartData: LineChartData = {
  type: 'line',
  height: 90,
  options: {
    chart: {
      sparkline: {
        enabled: true
      }
    },
    dataLabels: {
      enabled: false
    },
    colors: ['#fff'],
    fill: {
      type: 'solid',
      opacity: 1
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    yaxis: {
      min: 0,
      max: 100,
      labels: {
        show: false
      }
    },
    tooltip: {
      fixed: {
        enabled: false
      },
      x: {
        show: false
      },
      y: {
        title: {
          formatter: (seriesName: string) => 'Total Order'
        }
      },
      marker: {
        show: false
      }
    }
  },
  series: [
    {
      name: 'series1',
      data: [45, 66, 41, 89, 25, 44, 9, 54]
    }
  ]
};