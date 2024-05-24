CREATE TABLE IF NOT EXISTS guilds(
    guildid TEXT PRIMARY KEY,
    forumid TEXT
);

CREATE TABLE IF NOT EXISTS auctions(
    guildid TEXT NOT NULL,
    auctionid TEXT NOT NULL,
    channelid TEXT NOT NULL,
    owner TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    highestbid REAL NOT NULL,
    amountbids INT DEFAULT 0,
    maxwinners INT DEFAULT 1,
    maxgroupbidders INT DEFAULT 1,
    settingsid TEXT NOT NULL,
    settingspage INT DEFAULT 0,
    FOREIGN KEY (guildid) REFERENCES guilds(guildid),
    PRIMARY KEY (guildid, auctionid, channelid)
);

CREATE TABLE IF NOT EXISTS bidders(
  guildid TEXT NOT NULL,
  auctionid INT NOT NULL,
  bidderid TEXT NOT NULL,
  amount REAL NOT NULL,
  FOREIGN KEY (guildid) REFERENCES guild(guildid),
  FOREIGN KEY (auctionid) REFERENCES auction(auctionid),
  PRIMARY KEY (guildid, auctionid, bidderid)

);