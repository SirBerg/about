import type {DataBaseObject} from "../../statGenerator/lib/types.ts";
import data from '../chartData/stats.json';
import './react.css'
import React, {useEffect, useState} from "react";
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LinearScale,
    Title,
    CategoryScale,
    Tooltip,
    ArcElement,
    BarElement,
    Legend
} from 'chart.js';
type LineChartDataSet = {
    data: number[],
    label: string,
    borderColor: string,
    fill: boolean,
    yAxisID: string
}
import {Doughnut, Line, Bar} from "react-chartjs-2";
//@ts-ignore
let stats: DataBaseObject = data;

function processLineData(data:DataBaseObject){
    let reviewsPerDay = Object.values(data.reviewPerDay);
    let cardsInRotation:number[] = []
    let timeSpentPerDayMinutes:number[] = []
    let totalReviews:number[] = []
    let reviewsPerDayDate:number[] = []
    let avgTimeSpentPerCard:number[] = []

    let reviewCount:number = 0;
    for(const [index, value] of reviewsPerDay.entries()){
        cardsInRotation.push(value.totalCardsInRotation)
        timeSpentPerDayMinutes.push(value.time / 1000 / 60)
        reviewCount += value.count
        totalReviews.push(reviewCount)
        reviewsPerDayDate.push(value.count)
        let averageTimePerCard:number = value.time / 1000 / value.count
        if(!Number.isNaN(averageTimePerCard)){
            avgTimeSpentPerCard.push(averageTimePerCard)
        }
        else{
            avgTimeSpentPerCard.push(0)
        }
        avgTimeSpentPerCard.push()
    }
    return({
        cardsInRotation: cardsInRotation,
        timeSpentPerDayMinutes: timeSpentPerDayMinutes,
        totalReviews: totalReviews,
        reviewsPerDayDate: reviewsPerDayDate,
        avgTimeSpentPerCard: avgTimeSpentPerCard
    })
}

export function LineChart({data, days} : {data: DataBaseObject, days?: number}){
    const [lineChartLabelsPlusData, setLineChartLabelsPlusData] = useState<any>({
        labels: Object.keys(data.reviewPerDay),
        datasets: []
    })
    const LineChartOptions:any = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',

                // grid line settings
                grid: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                },
            },
            y2:{
                type: 'linear',
                display: false,
                position: 'right',
                grid: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                },
            }
        }
    }
    let lineChartDataPoints:LineChartDataSet[] = [
        {
            data: [],
            label: 'Total Reviews',
            borderColor: '#e8c3b9',
            fill: false,
            yAxisID: 'y1'
        },
        {
            data: [],
            label: 'Time spent per day (minutes)',
            borderColor: '#7a0bc5',
            fill: false,
            yAxisID: 'y'
        },
        {
            data: [],
            label: 'Average Time Spent per Card (seconds)',
            borderColor: '#c50b90',
            fill: false,
            yAxisID: 'y'
        },
        {
            data: [],
            label: 'Reviews per Day',
            borderColor: '#0b1ac5',
            fill: false,
            yAxisID: 'y2'
        },
        {
            data: [],
            label: 'Cards in Rotation',
            borderColor: '#0b8dc5',
            fill: false,
            yAxisID: 'y2'
        }
    ]

    useEffect(() => {
        let {cardsInRotation, timeSpentPerDayMinutes, totalReviews, reviewsPerDayDate, avgTimeSpentPerCard} = processLineData(data);
        lineChartDataPoints[0].data = totalReviews
        lineChartDataPoints[1].data = timeSpentPerDayMinutes
        lineChartDataPoints[2].data = avgTimeSpentPerCard
        lineChartDataPoints[3].data = reviewsPerDayDate
        lineChartDataPoints[4].data = cardsInRotation
        setLineChartLabelsPlusData({
            labels: Object.keys(data.reviewPerDay),
            datasets: lineChartDataPoints
        })
    }, []);
    return(
        <Line data={lineChartLabelsPlusData} options={LineChartOptions} style={{height:"500px", maxHeight: "500px"}}/>
    )
}

export function DoughnutChart({data}:{data:DataBaseObject}){
    const [doughnoutLabelsPlusData, setDoughnoutLabelsPlusData] = useState<any>({
        labels: ["Learning", "Relearning", "Young", "Mature"],
        datasets: []
    })
    const [processingDone, setProcessingDone] = useState(false)
    let doughnoutDataPoints = [
        {
            'label': '# of Intervals',
            'data': [],
            'backgroundColor': [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)',
            ],
            'borderColor': [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
            ],
            'borderWidth': 1
        }
    ]
    let doughnoutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Ease Distribution'
            }
        }
    }
    useEffect(() => {

        //@ts-ignore
        doughnoutDataPoints[0].data.push(data.intervalDistribution['-60'] ? data.intervalDistribution['-60'] : 0)
        //@ts-ignore
        doughnoutDataPoints[0].data.push(data.intervalDistribution['-600'] ? data.intervalDistribution['-600'] : 0)
        let youngCards:number = 0;
        let matureCards:number = 0;
        for(const key in stats.intervalDistribution){
            if(key !== '-6' && key !== '-600'){
                if(parseInt(key) < 21){
                    youngCards += data.intervalDistribution[key]
                } else {
                    matureCards += data.intervalDistribution[key]
                }
            }
        }
        //@ts-ignore
        doughnoutDataPoints[0].data.push(youngCards)
        //@ts-ignore
        doughnoutDataPoints[0].data.push(matureCards)
        setDoughnoutLabelsPlusData({
            labels: ["Learning", "Relearning", "Young", "Mature"],
            datasets: doughnoutDataPoints
        })
        setProcessingDone(true)
    }, []);
    return(
        <div>
            {
                !processingDone ? <p>Loading...</p> : <ul>
                    {/* @ts-ignore */}
                    <li><span
                        style={{color: 'rgba(255, 99, 132, 1)'}}>Learning: {doughnoutLabelsPlusData.datasets[0].data[0]} </span>
                    </li>
                    {/* @ts-ignore */}
                    <li><span
                        style={{color: 'rgba(54, 162, 235, 1)'}}>Relearning: {doughnoutLabelsPlusData.datasets[0].data[1]}</span>
                    </li>
                    {/* @ts-ignore */}
                    <li><span
                        style={{color: 'rgba(255, 206, 86, 1)'}}>Young: {doughnoutLabelsPlusData.datasets[0].data[2]}</span>
                    </li>
                    {/* @ts-ignore */}
                    <li><span
                        style={{color: 'rgba(75, 192, 192, 1)'}}>Mature: {doughnoutLabelsPlusData.datasets[0].data[3]}</span>
                    </li>
                </ul>
            }

            <Doughnut data={doughnoutLabelsPlusData}
                      options={{responsive: true}}
                      style={{width: "100vw", maxHeight: "700px"}}
            />
        </div>
    )
}

export function EaseChart({data}: { data: DataBaseObject }) {
    let barData = {
        labels: ['Ease Distribution'],
        datasets: []
    }
    barData.datasets = [
        //@ts-ignore
        {
            label: 'Ease 1',
            data: [data.easeDistribution['1'] ? data.easeDistribution['1'] : 0],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
        },
        //@ts-ignore
        {
            label: 'Ease 2',
            data: [data.easeDistribution['2'] ? data.easeDistribution['2'] : 0],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
        },
        //@ts-ignore
        {
            label: 'Ease 3',
            data: [data.easeDistribution['3'] ? data.easeDistribution['3'] : 0],
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
        },
        //@ts-ignore
        {
            label: 'Ease 4',
            data: [data.easeDistribution['4'] ? data.easeDistribution['4'] : 0],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
        },
    ]

    return(
        <div>
            <Bar data={barData} options={{responsive: true}} style={{width: "100vw", maxHeight: "700px"}}/>
        </div>

    )
}

export function ZoomButton({text, id, onclick}: { text: string, id: string, onclick: () => void }) {
    return (
        <button id={id} onClick={onclick} className="reactButton">{text}</button>
    )
}


export default function ReactCharts() {
    const [lineChartKey, setLineChartKey] = useState<any>(0)
    const [isRegistered, setIsRegistered] = useState(false);
    const [chartData, setChartData] = useState<DataBaseObject>(stats);
    useEffect(() => {
        ChartJS.register(
            LineElement,
            PointElement,
            LinearScale,
            Title,
            CategoryScale,
            Tooltip,
            ArcElement,
            Legend,
            BarElement
        );
        setIsRegistered(true);
    }, []);

    function changeData(id:string){
        if(id.startsWith('y')){
            let year = id.slice(1)
            //@ts-ignore
            let dataYear:DataBaseObject = stats.dataPerYear[year]
            if(data === undefined){
                console.log('Data not found for year ' + year)
                dataYear = stats
            }
            setChartData(dataYear)
            setLineChartKey(lineChartKey + 1)
        }
        else if(id === 'Lifetime'){
            setChartData(stats)
            setLineChartKey(lineChartKey + 1)
        }

    }

    return (
        <div className="reactCharts">
            {/*@ts-ignore*/}
            <h3>There are currently <span className="coolLookingHeader">{stats.reviewPerDay[Object.keys(stats.reviewPerDay)[Object.keys(stats.reviewPerDay).length - 1]].totalCardsInRotation} cards </span> in rotation, which were reviewed <span className = "coolLookingHeader">{stats.reviewTotalCount} times </span> which took <span className="coolLookingHeader">{stats.reviewTotalTime / 1000 / 60 / 60} Hours</span> </h3>
            <h2>Reviews</h2>
            {
                //@ts-ignore
                Object.keys(stats.dataPerYear).map((year:string) => {
                    return <ZoomButton text={year} id={"y" + year} onclick={()=>{changeData('y' + year)}} />
                })
            }
            <ZoomButton text={"Lifetime"} id={"Lifetime"} onclick={()=>{changeData('Lifetime')}} />
            {
                isRegistered ? (
                    <div>
                        <LineChart data={chartData} key={lineChartKey}/>
                        <h2>Card Counts</h2>
                        <DoughnutChart data={stats}/>
                        <h2>Ease distribution per Cards</h2>
                        <EaseChart data={stats}/>
                    </div>
                ) : (
                    <p>Loading...</p>
                )
            }
        </div>
    )
}
