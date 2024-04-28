//Script to generate stats for all the cards from the Anki DB (in ./dist/collection.anki2)
// and save them to a JSON file (in ./dist/stats.json)
import type {AnkiDBCollection, AnkIDBDeck, AnkiRevision} from "./lib/ankiDBTypes";
import {DataBaseObject} from "./lib/types";
const logger = require('./lib/logger').default;
const env = require('dotenv').config()
const fs = require('node:fs');

const log = new logger();

async function main(){
    log.log('Starting stat generation', 'info', 'Startup');
    log.log('Checking for Anki DB', 'debug', 'Startup');
    //Check if the Anki DB exists
    const dbPath = process.env.ANKI_DB_PATH ? process.env.ANKI_DB_PATH : './dist/collection.anki2';
    if(!fs.existsSync(dbPath)){
        log.log('Was not able to find AnkiDB, did you set the ANKI_DB_PATH variable in your .env file?', 'error', 'Startup')
        process.exit(1);
    }
    const db = require('better-sqlite3')(dbPath, {readonly: true, verbose: process.env.LOG_LEVEL == 'debug' ? console.log : null});
    log.log('AnkiDB Locked and Loaded!', 'info', 'Startup');

    log.log('Checking for stats.json & unlinking if found', 'debug', 'Startup');
    if(fs.existsSync('./dist/stats.json')){
        fs.unlinkSync('./dist/stats.json');
        log.log('stats.json found and deleted', 'info', 'Startup');
    }

    log.log('Checking collections table', 'debug', 'DB Check');
    const decks:Array<AnkIDBDeck> = db.prepare('SELECT * FROM decks').all();

    //choose the deck you want to generate stats fro
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
    const revisions:Array<AnkiRevision> = db.prepare(`SELECT revlog.* 
        FROM main.revlog
            INNER JOIN  main.cards ON main.revlog.cid = main.cards.id
            WHERE main.cards.did = ${chosenDeck.id}
        ORDER BY main.revlog.id ASC;
    `).all();
    log.log(`Got ${revisions.length} revisions for the deck`, 'debug', 'DB Check');

    let generatedStats:DataBaseObject = {
        reviewTotalCount: revisions.length,
        reviewTotalTime: 0,
        reviewPerDay: {},
        easeDistribution: {},
        intervalDistribution: {}
    }

    let cardIds:Array<number> = [];
    let intervals = {}


    //build the stats
    for(const revision of revisions){
        generatedStats.reviewTotalTime += revision.time;
        const date = new Date(revision.id).toLocaleDateString('en-GB');

        //add the ease to the ease distribution
        if(generatedStats.easeDistribution[revision.ease]){
            generatedStats.easeDistribution[revision.ease] += 1;
        } else {
            generatedStats.easeDistribution[revision.ease] = 1;
        }

        if(cardIds.indexOf(revision.cid) === -1){
            cardIds.push(revision.cid);
        }

        if(generatedStats.reviewPerDay[date]){
            generatedStats.reviewPerDay[date].count += 1;
            generatedStats.reviewPerDay[date].time += revision.time;
        } else {
            generatedStats.reviewPerDay[date] = {
                count: 1,
                time: revision.time,
                totalCardsInRotation: cardIds.length
            }
        }

        //overwrite the interval, at the end we have the most up-to-date one
        intervals[revision.cid] = revision.ivl;
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
    //save the stats to a file
    fs.writeFileSync('./dist/stats.json', JSON.stringify(generatedStats));
    log.log('Stats saved to stats.json', 'info', 'File Write');
}
main().catch((e:Error) => log.log(e.message, 'error', 'Main'));
