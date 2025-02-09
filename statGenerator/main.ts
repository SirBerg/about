//Script to generate stats for all the cards from the Anki DB (in ./dist/collection.anki2)
// and save them to a JSON file (in ./dist/stats.json)
import type {AnkiDBCollection, AnkIDBDeck, AnkiRevision} from "./lib/ankiDBTypes";
import {DataBaseObject} from "./lib/types";
const sqlite3 = require('sqlite3').verbose();
const logger = require('./lib/logger').default;
const env = require('dotenv').config()
const fs = require('node:fs');
const addEmptyDates = process.env.ADD_EMPTY_DATES ? process.env.ADD_EMPTY_DATES === "true" : false;
const addSeperateYears = process.env.ADD_SEPERATE_YEARS ? process.env.ADD_SEPERATE_YEARS === "true" : false;
const log = new logger();

export const fetchAll = async (db, sql, params):Promise<any> => {
    return new Promise((resolve, reject):any => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
};

async function main(){
    log.log('Starting stat generation', 'info', 'Startup');
    log.log('Checking for Anki DB', 'debug', 'Startup');
    //Check if the Anki DB exists
    const dbPath = process.env.ANKI_DB_PATH ? process.env.ANKI_DB_PATH : './dist/collection.anki2';
    if(!fs.existsSync(dbPath)){
        log.log('Was not able to find AnkiDB, did you set the ANKI_DB_PATH variable in your .env file?', 'error', 'Startup')
        process.exit(1);
    }
    const db = new sqlite3.Database(dbPath)
    log.log('AnkiDB Locked and Loaded!', 'info', 'Startup');

    log.log('Checking for stats.json & unlinking if found', 'debug', 'Startup');
    if(fs.existsSync('./dist/stats.json')){
        fs.unlinkSync('./dist/stats.json');
        log.log('stats.json found and deleted', 'info', 'Startup');
    }
    log.log('Checking collections table', 'debug', 'DB Check');
    const decks:Array<AnkIDBDeck> = await fetchAll(db, 'SELECT * FROM decks', []).catch((err)=>{
        log.log('Error fetching from decks table', 'error', 'DB Check');
        log.log(err, 'error', 'DB Check');
        process.exit(1);
    });

    //choose the deck you want to generate stats from
    let chosenDeck:AnkIDBDeck = {} as AnkIDBDeck
    if(decks.length === 0){
        log.log('No decks found in the AnkiDB, exiting', 'error', 'DB Check');
        process.exit(1);
    }

    //if we have only one deck, choose it
    if(decks.length === 1){
        chosenDeck = decks[0];
        log.log(`Found one deck: ${chosenDeck.name}, taking that`, 'info', 'DB Check');
    }
    //if we have multiple decks and no deck id, prompt the user to choose and restart
    if(decks.length > 1 && !process.env.ANKI_DECK_ID){
        log.log('Multiple decks and no ANKI_DECK_ID found. For automated use, please set this variable in your .env', 'warning', 'DB Check');
        log.log('I found these decks:', 'info', 'DB Check');
        decks.forEach((deck:AnkIDBDeck) => {
            log.log(`Deck ID: ${deck.id}, Name: ${deck.name}`, 'info', 'DB Check');
        });
        log.log('Please set the ANKI_DECK_ID variable in your .env to the ID of the deck you want to generate stats for', 'info', 'DB Check');
        process.exit(0);
    }

    //if we have multiple decks and a deck id, choose the deck
    if(!chosenDeck.id && process.env.ANKI_DECK_ID){
        chosenDeck = decks.find((deck:AnkIDBDeck) => deck.id === parseInt(process.env.ANKI_DECK_ID));
        if(!chosenDeck){
            log.log('Could not find the deck you specified, exiting', 'error', 'DB Check');
            process.exit(1);
        }
    }

    //very last check to make sure we have a deck
    if(!chosenDeck.id){
        log.log('Could not find a deck to generate stats for, is ANKI_DECK_ID incorrect? Exiting', 'error', 'DB Check');
        process.exit(1);
    }
    log.log(`Deck chosen: ${chosenDeck.name}`, 'info', 'DB Check');

    //get all the revisions
    log.log('Getting everything  revisions table', 'debug', 'DB Check');
    const revisions:Array<AnkiRevision> = await fetchAll(db, `
        SELECT revlog.* 
            FROM main.revlog
                INNER JOIN  main.cards ON main.revlog.cid = main.cards.id
                WHERE main.cards.did = ${chosenDeck.id}
            ORDER BY main.revlog.id ASC;
    `, []).catch((err)=>{
        log.log('Error fetching from revlog table', 'error', 'DB Check');
        log.log(err, 'error', 'DB Check');
        process.exit(1);
    })
    log.log(`Got ${revisions.length} revisions for the deck`, 'debug', 'DB Check');

    let generatedStats:DataBaseObject = {
        reviewTotalCount: revisions.length,
        reviewTotalTime: 0,
        reviewPerDay: {},
        easeDistribution: {},
        intervalDistribution: {},
    }
    if(addSeperateYears === true){
        generatedStats.dataPerYear = {}
    }

    let cardIds:Array<number> = [];
    let intervals = {}
    let lastDate:number = revisions[0].id;
    let intervalsByYear = {}
    //build the stats
    for(const revision of revisions){
        generatedStats.reviewTotalTime += revision.time;
        let dateWeShouldHave = new Date(lastDate + 8.64e+7).toLocaleDateString('en-GB');
        const date = new Date(revision.id).toLocaleDateString('en-GB');
        let currentYear = date.split("/")[2].toString();

        //if we have the option to add seperate years and we don't have the year in the dataPerYear object, add it
        if(addSeperateYears === true && !generatedStats.dataPerYear[currentYear]){
            generatedStats.dataPerYear[currentYear] = {
                reviewTotalCount: 0,
                reviewTotalTime: 0,
                reviewPerDay: {},
                easeDistribution: {},
                intervalDistribution: {},
            }
        }

        //if the date is not the same as the last date, we need to add the missing days
        if(addEmptyDates === true && date !== dateWeShouldHave && revision.id !> lastDate+8.64e+7){
            log.log(`Found a gap in the dates, adding missing days`, 'debug', 'Stats');
            let currentDate = new Date(lastDate + 8.64e+7);

            //this means we have a missing date range that we need to add
            while(currentDate < new Date(revision.id)){
                log.log(`Adding missing date: ${currentDate.toLocaleDateString('en-GB')}`, 'debug', 'Stats');
                let missingDate = currentDate.toLocaleDateString('en-GB');
                if(generatedStats.reviewPerDay[missingDate]){
                    generatedStats.reviewPerDay[missingDate].count = 0;
                    generatedStats.reviewPerDay[missingDate].time = 0;
                    generatedStats.reviewPerDay[missingDate].totalCardsInRotation = cardIds.length;
                    if(addSeperateYears === true){
                        generatedStats.dataPerYear[date.split("/")[2]].reviewPerDay[missingDate].count = 0;
                        generatedStats.dataPerYear[date.split("/")[2]].reviewPerDay[missingDate].time = 0;
                        generatedStats.dataPerYear[date.split("/")[2]].reviewPerDay[missingDate].totalCardsInRotation = cardIds.length;
                    }
                } else {
                    generatedStats.reviewPerDay[missingDate] = {
                        count: 0,
                        time: 0,
                        totalCardsInRotation: cardIds.length
                    }
                    if(addSeperateYears === true){
                        generatedStats.dataPerYear[date.split("/")[2]].reviewPerDay[missingDate] = {
                            count: 0,
                            time: 0,
                            totalCardsInRotation: cardIds.length
                        }
                    }
                }
                currentDate = new Date(currentDate.getTime() + 8.64e+7);
            }
        }

        if(addSeperateYears === true){
            generatedStats.dataPerYear[currentYear].reviewTotalCount += 1;
            generatedStats.dataPerYear[currentYear].reviewTotalTime += revision.time;
        }
        //add the ease to the ease distribution
        if(generatedStats.easeDistribution[revision.ease]){
            generatedStats.easeDistribution[revision.ease] += 1;
            if(addSeperateYears === true){
                generatedStats.dataPerYear[date.split("/")[2]].easeDistribution[revision.ease] += 1;
            }
        } else {
            generatedStats.easeDistribution[revision.ease] = 1;
            if(addSeperateYears === true){
                generatedStats.dataPerYear[date.split("/")[2]].easeDistribution[revision.ease] = 1;
            }
        }

        if(cardIds.indexOf(revision.cid) === -1){
            cardIds.push(revision.cid);
            if(addSeperateYears === true){
                generatedStats.dataPerYear[date.split("/")[2]].reviewTotalCount += 1;
            }
        }

        //add the review to the review per day
        if(generatedStats.reviewPerDay[date]){
            generatedStats.reviewPerDay[date].count += 1;
            generatedStats.reviewPerDay[date].time += revision.time;
            if(addSeperateYears === true){
                generatedStats.dataPerYear[date.split("/")[2]].reviewPerDay[date].count += 1;
                generatedStats.dataPerYear[date.split("/")[2]].reviewPerDay[date].time += revision.time;
            }
        } else {
            generatedStats.reviewPerDay[date] = {
                count: 1,
                time: revision.time,
                totalCardsInRotation: cardIds.length
            }

            if(addSeperateYears === true){
                generatedStats.dataPerYear[date.split("/")[2]].reviewPerDay[date] = {
                    count: 1,
                    time: revision.time,
                    totalCardsInRotation: cardIds.length
                }
            }
        }

        //overwrite the interval, at the end we have the most up-to-date one for the card
        intervals[revision.cid] = revision.ivl;

        //overwrite the last date so we can check it in the next loop
        lastDate = revision.id;
    }
    let generatedIntervals = {}
    //generate the intervals because I don't know how to sql
    for(const key in intervals){
        if(generatedIntervals[intervals[key]]){
            generatedIntervals[intervals[key]] += 1;
        } else {
            generatedIntervals[intervals[key]] = 1;
        }
    }
    generatedStats.intervalDistribution = generatedIntervals;

    log.log('Stats generated', 'info', 'Stats');

    //Check if the dist folder exists
    if(!fs.existsSync('./dist')){
        fs.mkdirSync('./dist');
    }

    //save the stats to a file
    fs.writeFileSync('./dist/stats.json', JSON.stringify(generatedStats));
    log.log('Stats saved to stats.json', 'info', 'File Write');
}
main()
