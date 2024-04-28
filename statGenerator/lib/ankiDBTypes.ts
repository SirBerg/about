export type AnkiDBCollection = {
    id: number,
    crt: number,
    mod: number,
    scm: number,
    ver: number,
    dty: number,
    usn: number,
    ls: number,
    conf: string,
    models: string,
    decks: string,
    dconf: string,
    tags: string
}

export type AnkIDBDeck = {
    id: number,
    name: string,
    mtime_secs: number,
    usn: number,
    common: Buffer;
    kind: Buffer;
}

export type AnkiRevision = {
    id: number,
    cid: number,
    usn: number,
    ease: number,
    ivl: number,
    lastIvl: number,
    factor: number,
    time: number,
    type: number
}
