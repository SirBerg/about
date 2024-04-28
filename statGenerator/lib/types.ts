export * from './ankiDBTypes'
export type generatedDayStat = {
    reviewCount: number,
    reviewTime: number,
    totalCardsInRotation: number,
}
export type DataBaseObject = {
    reviewTotalCount: number,
    reviewTotalTime: number,
    reviewPerDay: {
        [key: `${string}/${string}/${string}`]: generatedDayStat
    }

    //key is the ease, number is the amount of times that ease was used
    easeDistribution: {
        [key: number]: number
    },

    //key is the interval, number is the amount of times that interval was used
    intervalDistribution: {
        [key: string]: number
    }
}
