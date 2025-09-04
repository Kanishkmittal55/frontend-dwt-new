interface ChartData {
  type: string;
  height: number;
  options: {
    chart: {
      id: string;
      sparkline: {
        enabled: boolean;
      };
    };
    dataLabels: {
      enabled: boolean;
    };
    stroke: {
      curve: string;
      width: number;
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
    data: number[];
  }>;
}

// ==============================|| DASHBOARD - BAJAJ AREA CHART ||============================== //

const chartData: ChartData = {
  type: 'area',
  height: 95,
  options: {
    chart: {
      id: 'support-chart',
      sparkline: {
        enabled: true
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 1
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
          formatter: (seriesName: string) => 'Ticket '
        }
      },
      marker: {
        show: false
      }
    }
  },
  series: [
    {
      data: [0, 15, 10, 50, 30, 40, 25]
    }
  ]
};