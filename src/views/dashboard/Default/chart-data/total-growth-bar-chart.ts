interface ChartOptions {
  chart: {
    type: string;
    height: number;
    stacked: boolean;
    toolbar: { show: boolean };
    zoom: { enabled: boolean };
  };
  plotOptions: {
    bar: {
      horizontal: boolean;
      columnWidth: string;
    };
  };
  dataLabels: { enabled: boolean };
  xaxis: {
    type: string;
    categories: string[];
  };
  fill: { type: string };
  legend: {
    show: boolean;
    fontFamily: string;
    position: string;
    offsetX: number;
    labels: {
      useSeriesColors: boolean;
    };
    markers: {
      size: number;
      shape: string;
    };
    itemMargin: {
      horizontal: number;
      vertical: number;
    };
  };
  grid: { show: boolean };
}

// ==============================|| DASHBOARD - TOTAL GROWTH BAR CHART ||============================== //

const chartOptions: ChartOptions = {
  chart: {
    type: 'bar',
    height: 480,
    stacked: true,
    toolbar: { show: false },
    zoom: { enabled: true }
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '50%'
    }
  },
  dataLabels: { enabled: false },
  xaxis: {
    type: 'category',
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },
  fill: { type: 'solid' },
  legend: {
    show: true,
    fontFamily: 'Inter, sans-serif',
    position: 'bottom',
    offsetX: 10,
    labels: {
      useSeriesColors: false
    },
    markers: {
      size: 16,
      shape: 'circle'
    },
    itemMargin: {
      horizontal: 15,
      vertical: 8
    }
  },
  grid: { show: true }
};