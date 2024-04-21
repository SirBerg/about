import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LinearScale,
    Title,
    CategoryScale,
    Tooltip,
} from 'chart.js';
import { Line } from "react-chartjs-2";
import React, { useEffect, useState } from 'react';
export default function LineChart(){
    const [isRegistered, setIsRegistered] = useState(false);
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    })
    const [ready, setReady] = useState(false);
    useEffect(() => {
        ChartJS.register(
            LineElement,
            PointElement,
            LinearScale,
            Title,
            CategoryScale,
            Tooltip
        );
        setIsRegistered(true);
        async function main(){
            const requestOptions = {
                method: "GET",
                redirect: "follow"
            };

            let responseData: Array<any> = [];
            let newWordResponse: Array<any> = [];
            //@ts-ignore
            await fetch("/chartData/reviews.json", requestOptions)
                .then((response) => response.text())
                .then((result) => responseData = JSON.parse(result))
                .catch((error) => console.error(error));
            //@ts-ignore
            await fetch("/chartData/newWords.json", requestOptions)
                .then((response) => response.text())
                .then((result) => newWordResponse = JSON.parse(result))
                .catch((error) => console.error(error));


            let array_reviews = []
            let array_dates = []
            let array_newWords = []
            let array_newWordsSum = []
            let currentWords = 0
            for (let i = 0; i < responseData.length; i++) {
                array_reviews.push(responseData[i].num)
                array_dates.push(responseData[i].date)
            }
            for(let i = 0; i < newWordResponse.length; i++){
                array_newWords.push(newWordResponse[i].num)
                currentWords += newWordResponse[i].num
                array_newWordsSum.push(currentWords)
            }

            // @ts-ignore
            chartData.labels = array_dates
            // @ts-ignore
            chartData.datasets[0] = {
                data: array_reviews,
                label: 'Reviews',
                borderColor: '#3e95cd',
                fill: false,
            }
            // @ts-ignore
            chartData.datasets[1] = {
                data: array_newWords,
                label: 'New Words',
                borderColor: '#8e5ea2',
                fill: false,
            }
            // @ts-ignore
            chartData.datasets[2] = {
                data: array_newWordsSum,
                label: 'Sum of all Words learned',
                borderColor: '#3cba9f',
                fill: false,
            }
            setChartData(chartData)
            setReady(true)
        }
        main()
    }, []);

    if (!isRegistered) return <></>;
    return (
        <div>
            { ready ?
                <Line
                    data={chartData}
                    options={{ responsive: true, maintainAspectRatio: false}}
                    style={{width: "100vw"}}
                /> :
                <div>Loading...</div> }
        </div>
    );
}
