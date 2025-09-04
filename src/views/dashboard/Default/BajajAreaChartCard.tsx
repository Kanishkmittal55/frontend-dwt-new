import { useEffect, useState } from 'react';
import type { FC } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Card } from '@mui/material';

// third-party
import ApexCharts from 'apexcharts';
import Chart from 'react-apexcharts';

// project imports
import chartData from './chart-data/bajaj-area-chart';

// ===========================|| DASHBOARD DEFAULT - BAJAJ AREA CHART CARD ||=========================== //

const BajajAreaChartCard: FC = () => {
  const theme = useTheme();
  const orangeDark = theme.palette.secondary[800];

  useEffect(() => {
    const newSupportChart = {
      ...chartData.options,
      colors: [orangeDark],
      tooltip: {
        theme: 'light'
      }
    };
    ApexCharts.exec(`support-chart`, 'updateOptions', newSupportChart);
  }, [orangeDark]);

  const [series] = useState(chartData.series);
  const [options, setOptions] = useState(chartData.options);

  useEffect(() => {
    setOptions((prevState) => ({
      ...prevState,
      colors: [orangeDark],
      tooltip: {
        theme: 'light'
      }
    }));
  }, [orangeDark]);

  return (
    <Card sx={{ bgcolor: 'secondary.light' }}>
      <Chart {...{ options, series, type: 'area', height: 95 }} />
    </Card>
  );
};

export default BajajAreaChartCard;