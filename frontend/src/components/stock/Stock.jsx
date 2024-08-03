import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  TimeScale,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import "chartjs-adapter-date-fns";
import moment from "moment/moment";
import alert from "../../utils/alert";
import apiService from "../../services/api";
import "./Stock.css";

ChartJS.register(LineElement, TimeScale, LinearScale, PointElement, Tooltip);

const Stock = ({ symbol, setHidden, held }) => {
  const [stockData, setStockData] = useState(null);
  const [stockStats, setStockStats] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState("");
  const [graphMode, setGraphMode] = useState("Max");

  const transformToGraphData = (history) => {
    const labels = history.map((day) => day.date.split("T")[0]);
    const data = history.map((day) => day.close);

    return {
      labels: labels,
      datasets: [
        {
          label: "Stock Price",
          data: data,
          fill: false,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
          pointHoverBackgroundColor: "rgb(75, 192, 192)",
          pointHoverBorderColor: "rgb(75, 192, 192)",
          pointRadius: 0,
          pointHoverRadius: 10,
        }
      ],
    };
  };

  useEffect(() => {
    if (!symbol || symbol === "") {
      return;
    }

    apiService.getStockStats(symbol).then((res1) => {
      console.log(res1.data);
      setStockStats(res1.data);
      apiService.getStockHistory(symbol).then((res2) => {
        setStockHistory(res2.data.history);
        setGraphData(transformToGraphData(res2.data.history));
        setUnit("year");
        setStockData(res2.data.history[res2.data.history.length - 1]);
        setLoading(false);
      }).catch((e) => {
        alert.error(e.response.data.error);
      });
    }).catch((e) => {
      alert.error(e.response.data.error);
    });
  }, [symbol]);

  const hoverLine = {
    id: "hoverLine",
    afterDatasetsDraw(chart) {
      if (!chart) return;

      const { ctx, tooltip, chartArea: { top, bottom }, scales: { x } } = chart;
      if (tooltip._active && tooltip._active.length > 0) {
        const xCoord = x.getPixelForValue(tooltip.dataPoints[0].parsed.x);

        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "black";
        ctx.setLineDash([4, 4]);
        ctx.moveTo(xCoord, top);
        ctx.lineTo(xCoord, bottom);
        ctx.stroke();
        ctx.closePath();
        ctx.setLineDash([]);
      }
    }
  }

  const options = {
    legend: false,
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      tooltip: {
        yAlign: "top",
        callbacks: {
          title: (context) => {
            const time = context[0].label;
            const splitIndex = time.lastIndexOf(",");
            return time.substring(0, splitIndex);
          },
          label: (context) => {
            return `$${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: unit,
        },
      },
    },
  };

  const plotWeek = () => {
    let weekData = stockHistory.slice(-5);
    setGraphData(transformToGraphData(weekData));
    setUnit("day");
    setGraphMode("1W");
  };

  const plotMonth = () => {
    let monthData = stockHistory.slice(-30);

    if (monthData.length === 0) {
      alert.error("No data available for the last month.");
      return;
    }

    const mostRecentDay = new Date(monthData[monthData.length - 1].date);
    const lastMonthDay = moment(mostRecentDay).subtract(30, "days");
    let sliceIndex = 0;

    for (let i = 0; i < monthData.length; i++) {
      if (new Date(monthData[i].date) >= lastMonthDay) {
        break;
      }
      ++sliceIndex;
    }

    monthData = monthData.slice(sliceIndex);
    setGraphData(transformToGraphData(monthData));
    setUnit("day");
    setGraphMode("1M");
  };

  const plotQuarterly = () => {
    let quarterlyData = stockHistory.slice(-90);

    if (quarterlyData.length === 0) {
      alert.error("No data available for the last quarter.");
      return;
    }

    const mostRecentDay = new Date(quarterlyData[quarterlyData.length - 1].date);
    const quarterBegin = moment(mostRecentDay).startOf("quarter");
    let sliceIndex = 0;

    for (let i = 0; i < quarterlyData.length; i++) {
      if (new Date(quarterlyData[i].date) >= quarterBegin) {
        break;
      }
      ++sliceIndex;
    }

    quarterlyData = quarterlyData.slice(sliceIndex);
    setGraphData(transformToGraphData(quarterlyData));
    setUnit("day");
    setGraphMode("Q");
  };

  const plotYearly = () => {
    let yearlyData = stockHistory.slice(-365);
    
    if (yearlyData.length === 0) {
      alert.error("No data available for the last year.");
      return;
    }

    const mostRecentDay = new Date(yearlyData[yearlyData.length - 1].date);
    const lastYearDay = moment(mostRecentDay).subtract(1, "year");
    let sliceIndex = 0;

    for (let i = 0; i < yearlyData.length; i++) {
      if (new Date(yearlyData[i].date) >= lastYearDay) {
        break;
      }
      ++sliceIndex;
    }

    yearlyData = yearlyData.slice(sliceIndex);
    setGraphData(transformToGraphData(yearlyData));
    setUnit("month");
    setGraphMode("1Y");
  };

  const plotFiveYears = () => {
    let fiveYearData = stockHistory.slice(-1825);
    
    if (fiveYearData.length === 0) {
      alert.error("No data available for the last five years.");
      return;
    }

    const mostRecentDay = new Date(fiveYearData[fiveYearData.length - 1].date);
    const lastFiveYearDay = moment(mostRecentDay).subtract(5, "year");
    let sliceIndex = 0;

    for (let i = 0; i < fiveYearData.length; i++) {
      if (new Date(fiveYearData[i].date) >= lastFiveYearDay) {
        break;
      }
      ++sliceIndex;
    }

    fiveYearData = fiveYearData.slice(sliceIndex);
    setGraphData(transformToGraphData(fiveYearData));
    setUnit("year");
    setGraphMode("5Y");
  };

  const plotMax = () => {
    setGraphData(transformToGraphData(stockHistory));
    setUnit("year");
    setGraphMode("Max");
  };

  const plotFuture = () => {
    const sh = stockHistory[stockHistory.length-1];
    const newData = [...stockHistory];
    const isd = stockHistory[0].close;
    const dh = new Date(sh.date);
    const y = dh.getFullYear();

    for (let i = 1; i < 3; i++) {
      newData.push({
        close: (sh.close-isd)*i,
        date: dh.toISOString()
      });

      dh.setFullYear(dh.getFullYear() + 1);
    }

    setGraphData(transformToGraphData(newData));
    setUnit("year");
    setGraphMode("Future");
  }

  const destroy = (e) => {
    if (e.target !== e.currentTarget) return;
    setHidden(true);
    plotMax();
  }

  return (
    symbol &&
    <div className="popup" onClick={destroy}>
      {loading ? <p>Loading...</p>
        :
      <div className="stock-container">
        <h2>Stock: {symbol}</h2>
        <h3>Held: {held}</h3>
        <h1 className="stock-price">${stockData.close.toFixed(2)}</h1>
        <button className="btn" onClick={plotWeek} disabled={graphMode === "1W"}>1W</button>
        <button className="btn" onClick={plotMonth} disabled={graphMode === "1M"}>1M</button>
        <button className="btn" onClick={plotQuarterly} disabled={graphMode === "Q"}>Q</button>
        <button className="btn" onClick={plotYearly} disabled={graphMode === "1Y"}>1Y</button>
        <button className="btn" onClick={plotFiveYears} disabled={graphMode === "5Y"}>5Y</button>
        <button className="btn" onClick={plotMax} disabled={graphMode === "Max"}>Max</button>
        <button className="btn" onClick={plotFuture} disabled={graphMode === "Future"}>Future</button>
        <div className="stock-graph">
          <Line data={graphData} plugins={[hoverLine]} options={options}/>
        </div>
        <div className="row">
          <div className="col-2"></div>
          <div className="col-3">
            <p>Open: ${stockData.close.toFixed(2)}</p>
            <p>High: ${stockData.high.toFixed(2)}</p>
            <p>Low: ${stockData.low.toFixed(2)}</p>
          </div>
          <div className="col-2">
            <p>Close: ${stockData.close.toFixed(2)}</p>
            <p>Volume: {stockData.volume}</p>
            <p>Beta: {stockStats.beta}</p>
          </div>
          <div className="col-3">
            <p>Variance: {stockStats.variance}</p>
            <p>COV: {stockStats.cv}</p>
          </div>
          <div className="col-2"></div>
        </div>
      </div>
      }
    </div>
  );
};

export default Stock;
