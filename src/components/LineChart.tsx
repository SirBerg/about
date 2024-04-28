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
import {Doughnut, Line, Bar} from "react-chartjs-2";
import React, { useEffect, useState } from 'react';
import type {DataBaseObject} from "../../statGenerator/lib/types.ts";
export default function LineChart(){
    const [isRegistered, setIsRegistered] = useState(false);
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    })
    const [barData, setBarData] = useState({
        labels: ['Ease Distribution'],
        datasets: []
    })
    const [doughnutData, setDoughnutData] = useState({
        labels: ['Learning', 'Relearning', 'Young', 'Mature'],
        datasets: [],
    })
    const [data, setData] = useState({
        "totalReviews": 0,
        "totalTimeSpentHours": 0,
        "totalCardsInRotation": 0,
    });
    const [ready, setReady] = useState(false);
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
        async function main(){
            const requestOptions = {
                method: "GET",
                redirect: "follow"
            };

            //@ts-ignore
            let responseData: DataBaseObject = [];

            //@ts-ignore
            await fetch("/chartData/stats.json", requestOptions)
                .then((response) => response.text())
                .then((result) => responseData = JSON.parse(result))
                .catch((error) => console.error(error));

            let tmpChartData:any = {
                labels: [],
                datasets: []
            }
            let dates = Object.keys(responseData.reviewPerDay)
            let maxWordsInRotation = []
            let reviewCountPerDay = []
            let avgTimeSpentPerCard = []
            let reviewsPerDay:Array<number> = []
            let timeSpentPerDay = []
            let i = 0
            let dateLength = Object.keys(responseData.reviewPerDay).length
            let keys = Object.keys(responseData.reviewPerDay)

            do{
                let date = keys[i]
                // @ts-ignore
                let data = responseData.reviewPerDay[date]
                maxWordsInRotation.push(data.totalCardsInRotation)
                reviewCountPerDay.push(data.count)
                avgTimeSpentPerCard.push(data.time / 1000 / data.count)
                timeSpentPerDay.push(data.time / 1000 / 60)
                //add the reviews from last day to the current day
                if(i > 0){
                    reviewsPerDay.push(reviewsPerDay[i-1] + data.count)
                } else {
                    reviewsPerDay.push(data.count)
                }
                i++
            }
            while(i < dateLength)

            tmpChartData.labels = dates
            tmpChartData.datasets[0] = {
                data: maxWordsInRotation,
                label: 'Cards in Rotation',
                borderColor: '#3e95cd',
                fill: false,
                yAxisID: 'y'
            }
            tmpChartData.datasets[1] = {
                data: reviewCountPerDay,
                label: 'Reviews per Day',
                borderColor: '#8e5ea2',
                fill: false,
                yAxisID: 'y'
            }
            tmpChartData.datasets[2] = {
                data: avgTimeSpentPerCard,
                label: 'Average Time Spent per Card (seconds)',
                borderColor: '#3cba9f',
                fill: false,
                yAxisID: 'y'
            }
            tmpChartData.datasets[3] = {
                data: timeSpentPerDay,
                label: 'Time spent per day (minutes)',
                borderColor: '#b318cc',
                fill: false,
                yAxisID: 'y'
            }
            tmpChartData.datasets[4] = {
                data: reviewsPerDay,
                label: 'Total Reviews',
                borderColor: '#e8c3b9',
                fill: false,
                yAxisID: 'y1'
            }
            let doughnutChartDataTmp = {
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
            //@ts-ignore
            doughnutChartDataTmp.data[0] = responseData.intervalDistribution['-60'] ? responseData.intervalDistribution['-60'] : 0
            //@ts-ignore
            doughnutChartDataTmp.data[1] = responseData.intervalDistribution['-600'] ? responseData.intervalDistribution['-600'] : 0
            let youngCards = 0, matureCards = 0
            for(const key in responseData.intervalDistribution){
                if(key !== '-6' && key !== '-600'){
                    if(parseInt(key) < 21){
                        youngCards += responseData.intervalDistribution[key]
                    } else {
                        matureCards += responseData.intervalDistribution[key]
                    }
                }
            }

            //@ts-ignore
            doughnutChartDataTmp.data[2] = youngCards
            //@ts-ignore
            doughnutChartDataTmp.data[3] = matureCards
            let tmp = doughnutData
            //@ts-ignore
            tmp.datasets[0] = doughnutChartDataTmp

            barData.datasets = [
                //@ts-ignore
                {
                    label: 'Ease 1',
                    data: [responseData.easeDistribution['1'] ? responseData.easeDistribution['1'] : 0],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                },
                //@ts-ignore
                {
                    label: 'Ease 2',
                    data: [responseData.easeDistribution['2'] ? responseData.easeDistribution['2'] : 0],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                },
                //@ts-ignore
                {
                    label: 'Ease 3',
                    data: [responseData.easeDistribution['3'] ? responseData.easeDistribution['3'] : 0],
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                },
                //@ts-ignore
                {
                    label: 'Ease 4',
                    data: [responseData.easeDistribution['4'] ? responseData.easeDistribution['4'] : 0],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                },
            ]

            data.totalTimeSpentHours = responseData.reviewTotalTime / 1000 / 60 / 60
            data.totalReviews = responseData.reviewTotalCount
            data.totalCardsInRotation = maxWordsInRotation[maxWordsInRotation.length - 1]

            setDoughnutData(tmp)
            setChartData(tmpChartData)
            setReady(true)
        }
        main()
    }, []);

    if (!isRegistered) return <div>React is Loading...</div>;
    return (
        <div>
            <div>
                <h2>So far, there are currently <span className="coolLookingHeader">{data.totalCardsInRotation} Cards</span>  in Rotation, that were reviewed <span className="coolLookingHeader">{data.totalReviews} times</span> which took <span className="coolLookingHeader">{data.totalTimeSpentHours} Hours</span>
                </h2>
            </div>
            <div>
                <h2>Reviews</h2>
            </div>
            { ready ?
                <Line
                    data={chartData}
                    options={{
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
                        }
                    }}
                    style={{width: "100vw", maxHeight: "600px"}}
                /> :
                <div>Stupid React needs to load. Gimme a sec...</div> }
            <h2>Card Counts</h2>
            {
                ready ?
                    <ul>
                        {/* @ts-ignore */}
                        <li><span style={{color: 'rgba(255, 99, 132, 1)'}}>Learning: {doughnutData.datasets[0].data[0]} </span></li>
                        {/* @ts-ignore */}
                        <li><span style={{color: 'rgba(54, 162, 235, 1)'}}>Relearning: {doughnutData.datasets[0].data[1]}</span></li>
                        {/* @ts-ignore */}
                        <li><span style={{color: 'rgba(255, 206, 86, 1)'}}>Young: {doughnutData.datasets[0].data[2]}</span>
                        </li>
                        {/* @ts-ignore */}
                        <li><span style={{color: 'rgba(75, 192, 192, 1)'}}>Mature: {doughnutData.datasets[0].data[3]}</span>
                        </li>
                    </ul> :
                    <div>Stupid React needs to load. Gimme a sec...</div>
            }
            <div>
                {
                    ready ?
                        <Doughnut data={doughnutData}
                            options={{ responsive: true}}
                            style={{width: "100vw", maxHeight: "700px"}}
                        /> :
                        <div>Stupid React needs to load. Gimme a sec...</div>
                }
            </div>
            <div>
                <h2>Ease distribution per Cards</h2>
                {
                    ready ?
                        <Bar options={{
                            responsive: true,
                            maintainAspectRatio: false,
                        }}
                             data={barData}
                             style={{width: "100vw", maxHeight: "700px"}}
                        /> : <div>Stupid React needs to load. Gimme a sec...</div>
                }
            </div>
        </div>
    );
}
