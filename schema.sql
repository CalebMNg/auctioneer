CREATE TABLE IF NOT EXISTS guilds(
    guildid TEXT PRIMARY KEY,
    forumid TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auction(
    guildid TEXT NOT NULL,
    auctionid TEXT NOT NULL,
    highestbid REAL NOT NULL,
    FOREIGN KEY (guildid) REFERENCES guilds(guildid),
    PRIMARY KEY (guildid, auctionid)
);

CREATE TABLE IF NOT EXISTS bidders(
  guildid TEXT NOT NULL,
  auctionid TEXT NOT NULL,
  bidderid TEXT NOT NULL,
  FOREIGN KEY (guildid) REFERENCES guild(guildid),
  FOREIGN KEY (auctionid) REFERENCES auction(auctionid),
  PRIMARY KEY (guildid, auctionid, bidderid)

);