/*
* Very cool and definitely not sophisticated logger written by me and then copied across SO many projects
* Requires Chalk@v3 and dotenv
* Takes one environment variable LOG_LEVEL which can be set to 'debug' to enable debug messages
*/

export default class logger {
    private readonly chalk = require('chalk');
    private readonly dotenv = require('dotenv');
    //severity to hex color mapping
    private severities:{[key:string]:string} = {
        'debug': '#5f5fbd',
        'info': '#00ff00',
        'warning': '#ffff00',
        'error': '#ff0000'
    };
    private readonly startTime:number
    private readonly debug:boolean = false;
    constructor() {
        this.dotenv.config()
        this.debug = process.env.LOG_LEVEL?.toLowerCase() == 'debug';
        this.startTime = Date.now();
    }
    public log(message: string, severity: string = 'info', position?:string): Error | void  {
        //check if severity is valid
        if(Object.keys(this.severities).indexOf(severity) === -1){
            throw new Error('Invalid severity level');
        }

        //skip debug messages if debug is false
        if(this.debug === false && severity === 'debug'){
            return;
        }

        //log message and return
        console.log(this.chalk.hex(this.severities[severity])(`[${(Date.now() - this.startTime) / 1000} ${severity.toUpperCase()}] ${position} : ${message}`));
        return;
    }
    public table(data:Array<any>, severity:string = "info",  position?:string): Error | void {
        //log table
        if(this.debug === false && severity === 'debug'){
            return;
        }
        this.log('Logging table', severity, position);
        console.table(data);
        return;
    }
}
